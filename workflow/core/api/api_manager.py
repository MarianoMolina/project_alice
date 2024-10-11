from pydantic import BaseModel
from typing import Dict, Any, Union, Optional
from workflow.core.model import AliceModel
from workflow.core.api.api import API
from workflow.core.data_structures import References, ApiType, ApiName, ModelConfig, ModelApis
from workflow.util import LOGGER
from workflow.core.api.engines import APIEngine, ApiEngineMap

def get_api_engine(api_type: ApiType, api_name: ApiName) -> type[APIEngine]:
    """
    Get the appropriate API engine class based on the API type and name.
    
    Args:
        api_type (ApiType): The type of the API.
        api_name (ApiName): The name of the API.
    
    Returns:
        type[APIEngine]: The API engine class.
    
    Raises:
        ValueError: If no matching API engine is found.
    """
    try:
        return ApiEngineMap[api_type][api_name]
    except KeyError:
        raise ValueError(f"No API engine found for type {api_type} and name {api_name}")
    
class APIManager(BaseModel):
    """
    Manages a collection of APIs and provides methods to interact with them.

    This class is responsible for storing, retrieving, and utilizing various API
    configurations. It supports different types of APIs, including LLM (Language
    Model) APIs and search APIs.

    Attributes:
        apis (Dict[str, API]): A dictionary storing API objects, keyed by their names.
    """
    apis: Dict[str, API] = {}

    def add_api(self, api: API):
        """
        Add a new API to the manager.
        Args:
            api (API): The API object to be added.
        """
        self.apis[api.id] = api

    def get_api(self, api_name: str) -> Optional[API]:
        """
        Retrieve an API by its name.
        Args:
            api_name (str): The name of the API to retrieve.
        Returns:
            Optional[API]: The API object if found, None otherwise.
        """
        for api in self.apis.values():
            if api.api_name == api_name:
                return api
        return None
   
    def get_api_by_type(self, api_type: ApiType, model: Optional[AliceModel] = None) -> Optional[API]:
        """
        Retrieve an API by its type, optionally considering a specific model.

        This method handles both LLM and non-LLM API types differently.

        Args:
            api_type (ApiType): The type of API to retrieve.
            model (Optional[AliceModel]): The model to consider for LLM APIs.

        Returns:
            Optional[API]: The appropriate API object if found, None otherwise.
        """
        if isinstance(api_type, str):
            api_type = ApiType(api_type)
        if api_type in ModelApis:
            return self._retrieve_model_api(api_type, model)
        else:
            return self._retrieve_non_model_api(api_type)
    
    def _retrieve_model_api(self, api_type: ApiType = ApiType.LLM_MODEL, model: Optional[AliceModel] = None) -> Optional[API]:
        """
        Internal method to retrieve an API that uses models.

        This method attempts to find a matching API for the given model,
        or returns a default API if no specific model is provided.

        Args:
            model (Optional[AliceModel]): The model to match against.

        Returns:
            Optional[API]: The matching or default Model API if found, None otherwise.
        """
        available_apis = [api for api in self.apis.values() if ApiType(api.api_type) == api_type and api.is_active]
        
        if not available_apis:
            LOGGER.info(f'No {api_type} APIs found.')
            LOGGER.info(f'APIs: {self.apis}')
            return None
        
        if model:
            matching_api = next((api for api in available_apis if api.api_name == model.api_name and api.is_active), None)
            if matching_api:
                return matching_api
            else:
                LOGGER.error(f'No matching API found for model: {model} with api_name: {model.api_name}')

        # If no matching API found or no model specified, use the first available LLM API
        default_api = next((api for api in available_apis if api.default_model), None)
        if default_api:
            return default_api

        return None
    
    def _retrieve_non_model_api(self, api_type: ApiType) -> Optional[API]:
        """
        Internal method to retrieve a non-LLM API by type.

        Args:
            api_type (ApiType): The type of non-LLM API to retrieve.

        Returns:
            Optional[API]: The first active API matching the given type, or None if not found.
        """
        return next((api for api in self.apis.values() if api.api_type == api_type and api.is_active), None)
        
    def retrieve_api_data(self, api_type: ApiType, model: Optional[AliceModel] = None) -> Union[Dict[str, Any], ModelConfig]:
        """
        Retrieve the configuration data for a specific API type and model.

        Args:
            api_type (ApiType): The type of API to retrieve data for.
            model (Optional[AliceModel]): The model to consider for LLM APIs.

        Returns:
            Union[Dict[str, Any], ModelConfig]: The API configuration data.

        Raises:
            ValueError: If no active API is found for the given type.
        """
        api = self.get_api_by_type(api_type, model)
        if api is None:
            raise ValueError(f"No active API found for type: {api_type}")
        return api.get_api_data(model)

    async def generate_response_with_api_engine(self, api_type: ApiType, model: Optional[AliceModel] = None, **kwargs) -> References:
        """
        Select the appropriate API engine, validate inputs, and generate a response.

        This method handles the entire process of selecting an API, retrieving its data,
        initializing the correct engine, validating inputs, and generating a response.

        Args:
            api_type (ApiType): The type of API to use.
            model (Optional[AliceModel]): The preferred model to use, if applicable.
            **kwargs: Additional arguments to pass to the API engine.

        Returns:
            References: The generated response from the API engine.

        Raises:
            ValueError: If no API is found or if there's an error in generating the response.
        """
        LOGGER.debug(f"Chat generate_response_with_api_engine called with api_type: {api_type}, model: {model}, kwargs: {kwargs}")
        try:
            api = self.get_api_by_type(api_type, model)
            if not api:
                raise ValueError(f"No API found for type: {api_type}")
            LOGGER.debug(f"API found: {api}")
            api_data = api.get_api_data(model)
            
            api_engine = get_api_engine(api_type, api.api_name)()

            # Validate inputs against the API engine's input_variables
            self._validate_inputs(api_engine, kwargs)

            return await api_engine.generate_api_response(api_data, **kwargs)

        except Exception as e:
            import traceback
            LOGGER.error(f"Error generating response with API engine: {str(e)}")
            LOGGER.error(traceback.format_exc())
            raise ValueError(f"Error generating response with API engine: {str(e)}")

    def _validate_inputs(self, api_engine: APIEngine, kwargs: Dict[str, Any]):
        """
        Validate the input parameters against the API engine's expected inputs.

        This method checks if all required inputs are provided and if there are
        any unexpected inputs.

        Args:
            api_engine (APIEngine): The API engine to validate against.
            kwargs (Dict[str, Any]): The input parameters to validate.

        Raises:
            ValueError: If there are missing required inputs or unexpected inputs.
        """
        expected_inputs = api_engine.input_variables.properties
        for key, value in kwargs.items():
            if key not in expected_inputs:
                raise ValueError(f"Unexpected input: {key}")

        # Check for missing required inputs
        for required_input in api_engine.input_variables.required:
            if required_input not in kwargs:
                raise ValueError(f"Missing required input: {required_input}")
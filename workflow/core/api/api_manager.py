from pydantic import BaseModel
from typing import Dict, Any, Union, Optional
from workflow.core.api.api import API
from workflow.core.data_structures import References, ApiType, ApiName, ModelConfig, AliceModel
from workflow.util import LOGGER
from workflow.core.api.engines import APIEngine, ApiEngineMap
    
class APIManager(BaseModel):
    """
    Central manager for API configurations and interactions within the workflow system.
    
    APIManager serves as the orchestrator for all API interactions, maintaining a collection
    of configured APIs and providing methods to validate, access, and utilize them. It works
    in conjunction with APIEngine implementations to handle actual API calls.
    
    The manager supports two primary types of APIs:
    1. Model APIs (LLM, Vision, STT, TTS, etc.) that return model-specific configurations
    2. Service APIs (Search, Knowledge Graph, etc.) that return standard API configurations
    
    Key Responsibilities:
    - Managing API configurations and their lifecycle
    - Validating API availability and health
    - Routing API requests to appropriate engines
    - Providing standardized access to API configurations
    
    Attributes:
        apis (Dict[str, API]): Collection of configured APIs indexed by their IDs
    
    Example:
        ```python
        # Initialize manager with APIs
        manager = APIManager(apis={
            'gpt4': API(api_type=ApiType.LLM_MODEL, api_name=ApiName.OPENAI, ...),
            'search': API(api_type=ApiType.GOOGLE_SEARCH, api_name=ApiName.GOOGLE_SEARCH, ...)
        })
        
        # Generate response using appropriate engine
        response = await manager.generate_response_with_api_engine(
            api_type=ApiType.LLM_MODEL,
            model=my_model,
            messages=my_messages
        )
        ```
    """
    apis: Dict[str, API] = {}

    def add_api(self, api: API):
        """
        Add a new API to the manager.
        Args:
            api (API): The API object to be added.
        """
        self.apis[api.id] = api

    def get_api_by_type(self, api_type: ApiType, api_name: Optional[ApiName] = None) -> Optional[API]:
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
        if api_name:
            if isinstance(api_name, str):
                api_name = ApiName(api_name)
            matching_api = next((
                api for api in self.apis.values() 
                if ApiType(api.api_type) == api_type 
                and ApiName(api.api_name) == api_name
                and api.is_active
                ), None)
            return matching_api
        matching_api = next((
            api for api in self.apis.values() 
            if ApiType(api.api_type) == api_type 
            and api.is_active
            ), None)
        return matching_api
        
    def retrieve_api_data(self, api_type: ApiType, api_name: Optional[ApiName] = None, model: Optional[AliceModel] = None) -> Union[Dict[str, Any], ModelConfig]:
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
        api = self.get_api_by_type(api_type, api_name)
        if api is None:
            raise ValueError(f"No active API found for type: {api_type}")
        return api.get_api_data(model)

    async def generate_response_with_api_engine(self, api_type: ApiType, api_name: Optional[ApiName] = None, model: Optional[AliceModel] = None, **kwargs) -> References:
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
        LOGGER.debug(f"Chat generate_response_with_api_engine called with api_type: {api_type}, api_name: {api_name}, model: {model}, kwargs: {kwargs}")
        try:
            api_data = self.retrieve_api_data(api_type, api_name, model)
            LOGGER.debug(f"API data: {api_data}")
            
            api_engine = ApiEngineMap.get(api_type, {})
            if api_name:
                api_engine = api_engine.get(api_name)
            else:
                api_engine = next(iter(api_engine.values()), None)
            if api_engine is None:
                raise ValueError(f"No API engine found for {api_type} and {api_name}")

            # Validate inputs against the API engine's input_variables
            engine_instance: APIEngine = api_engine()
            LOGGER.debug(f"Selected API engine: {engine_instance.__class__.__name__}")
            self._validate_inputs(engine_instance, kwargs)

            return await engine_instance.generate_api_response(api_data=api_data, **kwargs)

        except Exception as e:
            import traceback
            LOGGER.error(f"Error generating response with API engine: {str(e)}")
            LOGGER.error(traceback.format_exc())
            raise ValueError(f"Error generating response with API engine: {str(e)}")

    def _validate_inputs(self, api_engine: APIEngine, kwargs: Dict[str, Any]) -> None:
        """
        Validate input parameters against the engine's schema.
        
        Internal method to ensure all provided parameters match the expectations
        defined in input_variables.
        
        Args:
            api_engine: The engine instance to validate against
            kwargs: Input parameters to validate
        
        Raises:
            ValueError: If validation fails
        
        Notes:
            - Checks for required parameters
            - Validates parameter types
            - Handles default values
            - Used internally before API calls
        """
        LOGGER.debug(f"Validating inputs for API engine: {api_engine.__class__.__name__}")
        expected_inputs = api_engine.input_variables.properties
        for key, value in kwargs.items():
            if key not in expected_inputs:
                LOGGER.warning(f"Unexpected input: {key} in api engine {api_engine.__class__.__name__}")

        # Check for missing required inputs
        for required_input in api_engine.input_variables.required:
            if required_input not in kwargs:
                raise ValueError(f"Missing required input: {required_input}")
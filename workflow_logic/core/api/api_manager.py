from pydantic import BaseModel
from typing import Dict, Any, Union, Optional
from workflow_logic.core.model import AliceModel
from workflow_logic.core.api.api import API
from workflow_logic.util import SearchOutput, MessageDict, ApiType, ApiName, LLMConfig, LOGGER
from workflow_logic.core.api.engines import APIEngine, LLMAnthropic, GoogleSearchAPI, RedditSearchAPI, WikipediaSearchAPI, ExaSearchAPI, ArxivSearchAPI, LLMEngine

ApiEngineMap = {
    ApiType.LLM_MODEL: {
        ApiName.OPENAI: LLMEngine,
        ApiName.ANTHROPIC: LLMAnthropic,
        ApiName.LM_STUDIO: LLMEngine,
        ApiName.AZURE: LLMEngine,
    },
    ApiType.GOOGLE_SEARCH: {
        ApiName.GOOGLE_SEARCH: GoogleSearchAPI,
    },
    ApiType.REDDIT_SEARCH: {
        ApiName.REDDIT_SEARCH: RedditSearchAPI,
    },
    ApiType.WIKIPEDIA_SEARCH: {
        ApiName.WIKIPEDIA_SEARCH: WikipediaSearchAPI,
    },
    ApiType.EXA_SEARCH: {
        ApiName.EXA_SEARCH: ExaSearchAPI,
    },
    ApiType.ARXIV_SEARCH: {
        ApiName.ARXIV_SEARCH: ArxivSearchAPI,
    },
}

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
    apis: Dict[str, API] = {}

    def add_api(self, api: API):
        self.apis[api.api_name] = api

    def get_api(self, api_name: ApiName) -> Optional[API]:
        return self.apis.get(api_name)
   
    def get_api_by_type(self, api_type: ApiType, model: Optional[AliceModel] = None) -> Optional[API]:
        if isinstance(api_type, str):
            api_type = ApiType(api_type)
        if api_type == ApiType.LLM_MODEL:
            return self._retrieve_llm_api(model)
        else:
            return self._retrieve_non_llm_api(api_type)
    
    def _retrieve_llm_api(self, model: Optional[AliceModel] = None) -> Optional[API]:
        llm_apis = [api for api in self.apis.values() if ApiType(api.api_type) == ApiType.LLM_MODEL and api.is_active]
        
        if not llm_apis:
            print("No LLM APIs found.")
            print(f'APIs: {self.apis}')
            return None
        if model:
            matching_api = next((api for api in llm_apis if api.api_name == model.api_name and api.is_active), None)
            if matching_api:
                return matching_api
            else:
                print(f'No matching API found for model: {model} with api_name: {model.api_name}')

        # If no matching API found or no model specified, use the first available LLM API
        default_api = next((api for api in llm_apis if api.default_model), None)
        if default_api:
            return default_api

        return None
    
    def _retrieve_non_llm_api(self, api_type: ApiType) -> Optional[API]:
        return next((api for api in self.apis.values() if api.api_type == api_type and api.is_active), None)
        
    def retrieve_api_data(self, api_type: ApiType, model: Optional[AliceModel] = None) -> Union[Dict[str, Any], LLMConfig]:
        api = self.get_api_by_type(api_type, model)
        if api is None:
            raise ValueError(f"No active API found for type: {api_type}")
        return api.get_api_data(model)

    async def generate_response_with_api_engine(self, api_type: ApiType, model: Optional[AliceModel] = None, **kwargs) -> Union[SearchOutput, MessageDict]:
        """
        Select the appropriate API engine, validate inputs, and generate a response.

        Args:
            api_type (ApiType): The type of API to use.
            model (Optional[AliceModel]): The preferred model to use, if applicable.
            **kwargs: Additional arguments to pass to the API engine.

        Returns:
            Union[SearchOutput, MessageDict]: The generated response from the API engine.
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

            # Generate response using the API engine
            response = await api_engine.generate_api_response(api_data, **kwargs)
            return response

        except Exception as e:
            LOGGER.error(f"Error generating response with API engine: {str(e)}")
            raise ValueError(f"Error generating response with API engine: {str(e)}")

    def _validate_inputs(self, api_engine: APIEngine, kwargs: Dict[str, Any]):
        # Validate that the provided kwargs match the expected input_variables of the API engine
        expected_inputs = api_engine.input_variables.properties
        for key, value in kwargs.items():
            if key not in expected_inputs:
                raise ValueError(f"Unexpected input: {key}")
            # You might want to add more specific type checking here based on your needs

        # Check for missing required inputs
        for required_input in api_engine.input_variables.required:
            if required_input not in kwargs:
                raise ValueError(f"Missing required input: {required_input}")
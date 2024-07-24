from pydantic import BaseModel
from typing import Dict, Any, Union, Optional
from workflow_logic.core.api.api_utils import ApiType, ApiName
from workflow_logic.core.model import AliceModel, LLMConfig
from workflow_logic.core.api.api import API

class APIManager(BaseModel):
    """
    Manages a collection of API configurations and provides methods to retrieve and use them.

    This class serves as a central repository for API configurations and offers utility
    methods to access and manage these configurations.

    Attributes:
        apis (Dict[str, API]): A dictionary of API configurations, keyed by their API names.

    Methods:
        add_api(api: API) -> None:
            Adds a new API configuration to the manager.
        get_api(api_name: ApiName) -> Optional[API]:
            Retrieves an API configuration by its name.
        get_api_by_type(api_type: ApiType) -> Optional[API]:
            Retrieves the first API configuration matching the given type.
        retrieve_api_data(api_type: ApiType, model: Optional[AliceModel] = None) -> Union[Dict[str, Any], LLMConfig]:
            Retrieves API data or LLMConfig based on the API type and model.

    Private Methods:
        _retrieve_llm_api_data(model: Optional[AliceModel] = None) -> LLMConfig:
            Retrieves LLMConfig for LLM APIs.
        _create_llm_config(api: API, model: AliceModel) -> LLMConfig:
            Creates an LLMConfig object for a given API and model.
        _retrieve_non_llm_api_data(api_type: ApiType) -> Dict[str, Any]:
            Retrieves configuration data for non-LLM APIs.

    Example:
        >>> manager = APIManager()
        >>> manager.add_api(API(api_type=ApiType.LLM_MODEL, api_name=ApiName.OPENAI, name="OpenAI GPT-3"))
        >>> llm_config = manager.retrieve_api_data(ApiType.LLM_MODEL)
    """
    apis: Dict[str, API] = {}

    def add_api(self, api: API):
        self.apis[api.api_name] = api

    def get_api(self, api_name: ApiName) -> Optional[API]:
        return self.apis.get(api_name)
    
    def get_api_by_type(self, api_type: ApiType) -> Optional[API]:
        return next((api for api in self.apis.values() if api.api_type == api_type), None)

    def retrieve_api_data(self, api_type: ApiType, model: Optional[AliceModel] = None) -> Union[Dict[str, Any], LLMConfig]:
        if isinstance(api_type, str):
            api_type = ApiType(api_type)
        if api_type == ApiType.LLM_MODEL:
            return self._retrieve_llm_api_data(model)
        else:
            return self._retrieve_non_llm_api_data(api_type)

    def _retrieve_llm_api_data(self, model: Optional[AliceModel] = None) -> LLMConfig:
        llm_apis = [api for api in self.apis.values() if ApiType(api.api_type) == ApiType.LLM_MODEL and api.is_active]
        
        if not llm_apis:
            raise ValueError("No active LLM APIs available.")

        if model:
            matching_api = next((api for api in llm_apis if api.default_model == model), None)
            if matching_api:
                return self._create_llm_config(matching_api, model)

        # If no matching API found or no model specified, use the first available LLM API
        default_api = next((api for api in llm_apis if api.default_model), None)
        if default_api:
            return self._create_llm_config(default_api, default_api.default_model)

        raise ValueError("No suitable LLM API found.")

    def _create_llm_config(self, api: API, model: AliceModel) -> LLMConfig:
        return api._create_llm_config(model)

    def _retrieve_non_llm_api_data(self, api_type: ApiType) -> Dict[str, Any]:
        matching_api = next((api for api in self.apis.values() if api.api_type == api_type and api.is_active), None)
        if not matching_api:
            raise ValueError(f"No active API found for type: {api_type}")
        return matching_api.api_config
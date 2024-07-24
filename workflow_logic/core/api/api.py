from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from bson import ObjectId
from workflow_logic.util.utils import User
from workflow_logic.core.model import AliceModel, LLMConfig
from workflow_logic.core.api.api_utils import ApiType, ApiName

class API(BaseModel):
    """
    Represents an API configuration for various services, including LLM models and search APIs.

    This class encapsulates the properties and methods needed to define and manage
    an API configuration, including its type, name, status, and associated model.

    Attributes:
        id (Optional[str]): The unique identifier for the API configuration.
        api_type (ApiType): The type of API (e.g., LLM_MODEL, GOOGLE_SEARCH).
        api_name (ApiName): The specific name or provider of the API.
        name (str): A human-readable name for this API configuration.
        is_active (bool): Indicates whether this API is currently active.
        health_status (str): The current health status of the API ("healthy", "unhealthy", or "unknown").
        default_model (Optional[AliceModel]): The default language model associated with this API.
        api_config (Optional[Dict[str, Any]]): Additional configuration parameters for the API.
        autogen_model_client_cls (Optional[str]): The class name for a custom AutoGen model client.
        created_by (Optional[User]): The user who created this API configuration.
        updated_by (Optional[User]): The user who last updated this API configuration.
        created_at (Optional[str]): The timestamp of when this configuration was created.
        updated_at (Optional[str]): The timestamp of when this configuration was last updated.

    Methods:
        _create_llm_config(model: Optional[AliceModel] = None) -> LLMConfig:
            Creates an LLMConfig object based on the API's configuration and the given model.

    Example:
        >>> api = API(api_type=ApiType.LLM_MODEL, api_name=ApiName.OPENAI, name="OpenAI GPT-3",
        ...           is_active=True, health_status="healthy",
        ...           api_config={"api_key": "your-api-key", "base_url": "https://api.openai.com/v1"})
    """
    id: Optional[str] = Field(default=None, alias="_id")
    api_type: ApiType
    api_name: ApiName
    name: str
    is_active: bool = True
    health_status: str = Field("unknown", pattern="^(healthy|unhealthy|unknown)$")
    default_model: Optional[AliceModel] = None
    api_config: Optional[Dict[str, Any]] = None
    autogen_model_client_cls: Optional[str] = Field(None, title="Autogen Model Client Class", description="Optional. The class for the autogen model client if it is a custom client.")
    created_by: Optional[User] = None
    updated_by: Optional[User] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
        
    def _create_llm_config(self, model: Optional[AliceModel] = None) -> LLMConfig:
        if not model: 
            if not self.default_model:
                raise ValueError("No model specified.")
            model = self.default_model
        config = {
            "model": model.model_name,
            "api_key": self.api_config.get("api_key"),
            "base_url": self.api_config.get("base_url"),
            "api_type": self.api_name
        }
        if self.autogen_model_client_cls:
            config["model_client_cls"] = self.autogen_model_client_cls
        return LLMConfig(config_list=[config], temperature=model.temperature, use_cache=model.use_cache)

class APIManager(BaseModel):
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

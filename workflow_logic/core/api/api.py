from enum import Enum, EnumMeta
from typing import Optional, Dict, Any, Union, List, Tuple
from pydantic import BaseModel, Field
from bson import ObjectId
from workflow_logic.util.utils import User
from workflow_logic.core.model import AliceModel, LLMConfig

class ApiType(str, Enum):
    LLM_MODEL = 'llm_api'
    GOOGLE_SEARCH = 'google_search'
    REDDIT_SEARCH = 'reddit_search'
    WIKIPEDIA_SEARCH = 'wikipedia_search'
    EXA_SEARCH = 'exa_search'
    ARXIV_SEARCH = 'arxiv_search'

class ApiNameMeta(EnumMeta):
    def __new__(metacls, cls, bases, classdict):
        # Extend with all ApiType values except LLM_MODEL
        for name, value in ApiType.__members__.items():
            if name != 'LLM_MODEL':
                classdict[name] = value.value
        
        # Add LLM-specific API names
        classdict['OPENAI'] = 'openai'
        classdict['AZURE'] = 'azure'
        classdict['ANTHROPIC'] = 'anthropic'
        classdict['CUSTOM'] = 'custom'
        
        return super().__new__(metacls, cls, bases, classdict)

    @classmethod
    def _missing_(cls, value):
        # This allows using ApiName with new ApiType values
        if value in ApiType.__members__:
            return cls(ApiType[value].value)
        return super()._missing_(value)

class ApiName(str, Enum, metaclass=ApiNameMeta):
    pass

# Helper function to get all ApiName values
def get_all_api_names() -> List[Tuple[str, str]]:
    return [(name, value) for name, value in ApiName.__members__.items()]

class API(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
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

class APIManager(BaseModel):
    apis: Dict[str, API] = {}

    def add_api(self, api: API):
        self.apis[api.api_name] = api

    def get_api(self, api_name: ApiName) -> Optional[API]:
        return self.apis.get(api_name)

    def retrieve_api_data(self, api_type: ApiType, model: Optional[AliceModel] = None) -> Union[Dict[str, Any], LLMConfig]:
        if api_type == ApiType.LLM_MODEL:
            return self._retrieve_llm_api_data(model)
        else:
            return self._retrieve_non_llm_api_data(api_type)

    def _retrieve_llm_api_data(self, model: Optional[AliceModel] = None) -> LLMConfig:
        llm_apis = [api for api in self.apis.values() if api.api_type == ApiType.LLM_MODEL and api.is_active]
        
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
        config = {
            "model": model.model_name,
            "api_key": api.api_config.get("api_key"),
            "base_url": api.api_config.get("base_url"),
            "api_type": api.api_name
        }
        if api.autogen_model_client_cls:
            config["model_client_cls"] = api.autogen_model_client_cls
        return LLMConfig(config_list=[config], temperature=model.temperature, use_cache=model.use_cache)

    def _retrieve_non_llm_api_data(self, api_type: ApiType) -> Dict[str, Any]:
        matching_api = next((api for api in self.apis.values() if api.api_type == api_type and api.is_active), None)
        if not matching_api:
            raise ValueError(f"No active API found for type: {api_type}")
        return matching_api.api_config

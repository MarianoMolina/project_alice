from typing import Optional, Dict, Any, Union
from pydantic import Field, field_validator
from workflow.core.data_structures import ApiType, ApiName, ModelConfig, ModelApis, AliceModel, BaseDataStructure
from workflow.core.api.api_config import APIConfig

class API(BaseDataStructure):
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
        config (Optional[APIConfig]): The configuration for this API including required credentials.
    """
    api_type: ApiType
    api_name: ApiName
    api_config: Optional[APIConfig] = None
    name: str
    is_active: bool = True
    health_status: str = Field("unknown", pattern="^(healthy|unhealthy|unknown)$")
    default_model: Optional[AliceModel] = None

    @field_validator('api_config')
    @classmethod
    def validate_api_config(cls, v: Optional[APIConfig], info) -> Optional[APIConfig]:
        """Validates that if config exists, it matches the API name and has valid configuration"""
        if not v:
            return v
            
        api_name = info.data.get('api_name')
        if v.api_name != api_name:
            raise ValueError(f"Config API name '{v.api_name}' does not match API name '{api_name}'")
            
        if not v.validate_config():
            raise ValueError(f"Invalid configuration for API {api_name}")
            
        api_type = info.data.get('api_type')
        supported_types = v.get_supported_types()
        if api_type not in supported_types:
            raise ValueError(f"API type '{api_type}' is not supported by {api_name}. Supported types: {supported_types}")
            
        return v

    def create_model_config(self, model: Optional[AliceModel] = None) -> ModelConfig:
        """Creates a ModelConfig object for model APIs"""
        if not model:
            if not self.default_model:
                raise ValueError("No model specified.")
            model = self.default_model
        
        if not self.api_config:
            raise ValueError("No API configuration provided")
            
        return ModelConfig(
            temperature=model.temperature,
            use_cache=model.use_cache,
            api_key=self.api_config.data.get("api_key"),
            base_url=self.api_config.data.get("base_url"),
            model=model.model_name if self.api_name != ApiName.LM_STUDIO else model.id,
            ctx_size=model.ctx_size,
        )

    def get_api_data(self, model: Optional[AliceModel] = None) -> Union[Dict[str, Any], ModelConfig]:
        """
        Returns the appropriate API data based on the API type.
        For LLM models, it returns an ModelConfig object.
        For other API types, it returns the api_config dictionary.
        
        Args:
            model (Optional[AliceModel]): The model to use for LLM APIs. If not provided,
                                        the default model will be used.
                                        
        Returns:
            Union[Dict[str, Any], ModelConfig]: The API data or ModelConfig object.
            
        Raises:
            ValueError: If the API is not active or if no model is specified for LLM APIs.
        """
        if not self.is_active:
            raise ValueError(f"API {self.name} is not active.")
            
        if not self.api_config:
            raise ValueError(f"No configuration provided for API {self.name}")
            
        if self.api_type in ModelApis:
            return self.create_model_config(model)
        else:
            return self.api_config.data

    class Config:
        populate_by_name = True
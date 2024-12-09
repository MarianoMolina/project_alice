from typing import Optional, Dict, Any, Union
from pydantic import Field, field_validator
from workflow.core.data_structures import ApiType, ApiName, ModelConfig, ModelApis, AliceModel, BaseDataStructure
from workflow.core.api.api_config import APIConfig
from workflow.util import LOGGER

class API(BaseDataStructure):
    """
    Represents a configured API endpoint with its associated settings and capabilities.
    
    The API class encapsulates all information needed to interact with a specific API
    service, including its type, configuration, and optional default model. It provides
    methods to validate configurations and prepare API data for requests.
    
    APIs can be broadly categorized into:
    1. Model APIs: Require model configurations (LLM, Vision, etc.)
    2. Service APIs: Require standard API credentials (Search, Knowledge Graph, etc.)
    
    Key Features:
    - Type-specific configuration validation
    - Model management for AI services
    - Health status tracking
    - Configuration data preparation
    
    Attributes:
        api_type (ApiType): The type of API service
        api_name (ApiName): The specific provider or implementation
        api_config (Optional[APIConfig]): Configuration details
        name (str): Human-readable name for the API
        is_active (bool): Current status of the API
        default_model (Optional[AliceModel]): Default model for AI services
    
    Example:
        ```python
        # Configure an LLM API
        llm_api = API(
            api_type=ApiType.LLM_MODEL,
            api_name=ApiName.OPENAI,
            api_config=APIConfig(
                name="openai-config",
                api_name=ApiName.OPENAI,
                data={"api_key": "key", "base_url": "url"}
            ),
            name="OpenAI GPT-4",
            default_model=gpt4_model
        )
        ```
    """
    api_type: ApiType
    api_name: ApiName
    api_config: Optional[APIConfig] = None
    name: str
    is_active: bool = True
    default_model: Optional[AliceModel] = None # TODO: Add validation to match api_name and model_type
    
    model_config = {
        "populate_by_name": True,
    }

    @field_validator('api_config')
    @classmethod
    def validate_api_config(cls, v: Optional[Union[Dict, APIConfig]], info) -> Optional[APIConfig]:
        """Validates and converts api_config input to APIConfig object if needed"""
        if not v:
            return v
            
        # Convert dict to APIConfig if necessary
        if isinstance(v, dict):
            try:
                v = APIConfig(**v)
            except Exception as e:
                raise ValueError(f"Failed to create APIConfig from dictionary: {str(e)}")
            
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
    
    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        if self.api_config:
            data['api_config'] = self.api_config.model_dump(*args, **kwargs)
        return data

    def create_model_config(self, model: Optional[AliceModel] = None) -> ModelConfig:
        """Creates a ModelConfig object for model APIs"""
        if not model:
            if not self.default_model:
                raise ValueError("No model specified.")
            model = self.default_model
        
        if not self.api_config:
            raise ValueError("No API configuration provided")
        
        api_key = self.api_config.data.get("api_key")
        if not api_key and self.api_name == ApiName.LM_STUDIO:
            api_key = 'dummy_string'
            
        return ModelConfig(
            temperature=model.config_obj.temperature,
            use_cache=model.config_obj.use_cache,
            api_key=api_key,
            base_url=self.api_config.data.get("base_url"),
            model=model.model_name if self.api_name != ApiName.LM_STUDIO else model.id,
            ctx_size=model.config_obj.ctx_size,
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
            LOGGER.warning(f"No configuration provided for API {self.name}")
            return {}
            
        if self.api_type in ModelApis:
            return self.create_model_config(model)
        else:
            return self.api_config.data
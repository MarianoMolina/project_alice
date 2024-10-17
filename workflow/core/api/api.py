from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Union
from workflow.util import LOGGER
from workflow.core.data_structures import ApiType, ApiName, ModelConfig, ModelApis
from workflow.core.model import AliceModel

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
    """
    id: Optional[str] = Field(default=None, alias="_id")
    api_type: ApiType
    api_name: ApiName
    name: str
    is_active: bool = True
    health_status: str = Field("unknown", pattern="^(healthy|unhealthy|unknown)$")
    default_model: Optional[AliceModel] = None
    api_config: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

    def _create_model_config(self, model: Optional[AliceModel] = None) -> ModelConfig:
        if not model:
            if not self.default_model:
                raise ValueError("No model specified.")
            model = self.default_model
        LOGGER.debug(f'model: {model}')
        LOGGER.debug(f'api self: {self}')
        return ModelConfig( 
            temperature=model.temperature, 
            use_cache=model.use_cache,
            api_key=self.api_config.get("api_key"),
            base_url=self.api_config.get("base_url"),
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

        if self.api_type in ModelApis:
            return self._create_model_config(model)
        else:
            return self.api_config if self.api_config else {}
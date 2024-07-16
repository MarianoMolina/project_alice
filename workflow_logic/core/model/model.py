from bson import ObjectId
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field, model_validator, ConfigDict
from workflow_logic.util.const import model_formats
from workflow_logic.core.model.model_config import LLMConfig

class AliceModel(BaseModel):
    id: str = Field(None, title="Model ID", description="The ID of the model.", alias="_id")
    short_name: str = Field(..., title="Short Name", description="The short name of the model.")
    model_name: str = Field(..., title="Model Name", description="The complete name of the model.")
    model_format: str = Field(..., title="Model Format", description="The format of the model.")
    ctx_size: int = Field(..., title="Context Size", description="The context size of the model.")
    model_type: Literal["instruct", "chat", "vision"] = Field(..., title="Model Type", description="The type of the model.")
    deployment: Literal["local", "remote"] = Field(..., title="Model Deployment", description="The deployment of the model.")
    api_name: Literal["openai", "azure", "anthropic"] = Field(default="openai", title="API name", description="The API to use for the model.")
    temperature: float = Field(0.7, description="The temperature setting for the model")
    seed: Optional[int] = Field(None, description="The seed for random number generation")
    use_cache: bool = Field(True, description="Whether to use caching for the model")
    model_config = ConfigDict(protected_namespaces=(), json_encoders = {ObjectId: str})

    @model_validator(mode="after")
    def validate_deployment(self):
        if self.deployment == "remote":
            if not self.base_url:
                raise ValueError(f"Remote model needs a valid base URL. Base URL for {self.short_name} not found.")
            if not self.api_key:
                raise ValueError(f"Remote model needs a valid API key. API key for {self.short_name} not found.")
        else:
            raise ValueError(f"Deployment {self.deployment} for {self.short_name} not found.")
        return self

    @model_validator(mode="after")
    def validate_model_format_dict(self):
        required_fields = ["input_prefix", "input_suffix", "antiprompt", "pre_prompt_prefix", "pre_prompt_suffix"]
        if self.model_format not in model_formats:
            raise Exception(f"Model format {self.model_format} not found.")
        for field in required_fields:
            if field not in self.model_format_dict.keys() or self.model_format_dict[field] is None:
                raise ValueError(f"Missing or invalid value for field: {field}")
        return self
    
    @property
    def model_format_dict(self) -> Dict:
        return self.get_model_format_dict()
    
    @property
    def antiprompts(self) -> List[str]:
        return self.model_format_dict.get("antiprompt", [])
    
    def autogen_default_llm_config(self, model_list: List[dict]) -> LLMConfig:
        if isinstance(model_list, dict):
            model_list = [model_list]
        return LLMConfig(temperature=0.3, config_list=model_list, timeout=120)
    
    def get_model_format_dict(self) -> dict:
        if self.model_format not in model_formats:
            raise Exception(f"Model format {self.model_format} not found.")
        else:
            return model_formats[self.model_format]
    
    def get_role_start(self, role_name, **kwargs):
        if role_name == "user" or role_name == "instruction":
            return self.model_format_dict.get("input_prefix", "")
        elif role_name == "assistant":
            return self.model_format_dict.get("input_suffix", "")
        elif role_name == "system":
            return self.model_format_dict.get("pre_prompt_prefix", "")
        else:
            return ""

    def get_role_end(self, role_name=None, **kwargs):
        if role_name == "system":
            return self.model_format_dict.get("pre_prompt_suffix", "")
        else:
            return ""
        
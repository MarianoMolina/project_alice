from typing import Dict, List, Optional
from pydantic import Field, model_validator, BaseModel
from workflow.util.const import model_formats
from workflow.core.data_structures.api_utils import ApiName, ModelType
from workflow.core.data_structures.base_models import BaseDataStructure

class ChatTemplateTokens(BaseModel):
    bos: str = Field("<|im_start|>", title="Beginning of Sentence", description="The token to use at the beginning of a sentence.");
    eos: str = Field("<|im_end|>", title="End of Sentence", description="The token to use at the end of a sentence.");
    system_role: Optional[str] = Field("system", title="System Role", description="The role of the system in the conversation.");
    user_role: Optional[str] = Field("user", title="User Role", description="The role of the user in the conversation.");
    assistant_role: Optional[str] = Field("assistant", title="Assistant Role", description="The role of the assistant in the conversation.");
    tool_role: Optional[str] = Field("tool", title="Tool Role", description="The role of the tool in the conversation.");
    class Config:
        extra = "ignore"
        
class ModelConfigObj(BaseModel):
    ctx_size: int = Field(4096, title="Context Size", description="The context size of the model.");
    temperature: float = Field(0.7, title="Temperature", description="The temperature setting for the model.");
    seed: Optional[int] = Field(None, title="Seed", description="The seed for random number generation.");
    use_cache: bool = Field(False, title="Use Cache", description="Whether to use caching for the model.");
    prompt_config: ChatTemplateTokens = Field(default_factory=ChatTemplateTokens, title="Prompt Configuration", description="The configuration for the chat template tokens.");

class AliceModel(BaseDataStructure):
    short_name: str = Field(..., title="Short Name", description="The short name of the model.")
    model_name: str = Field(..., title="Model Name", description="The complete name of the model.")
    model_format: str = Field(..., title="Model Format", description="The format of the model.")
    api_name: ApiName = Field(default='lm_studio', title="API name", description="The API to use for the model.")
    model_type: ModelType = Field(..., title="Model Type", description="The type of the model.")
    config_obj: ModelConfigObj = Field(default_factory=ModelConfigObj, title="Model Configuration", description="The configuration for the model.")

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
        
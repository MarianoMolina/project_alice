from typing import Optional
from pydantic import Field, BaseModel, ConfigDict
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
    max_tokens_gen: int = Field(4096, title="Max Tokens Generated", description="The maximum number of tokens to generate.");
    temperature: float = Field(0.7, title="Temperature", description="The temperature setting for the model.");
    seed: Optional[int] = Field(None, title="Seed", description="The seed for random number generation.");
    use_cache: bool = Field(False, title="Use Cache", description="Whether to use caching for the model.");
    prompt_config: ChatTemplateTokens = Field(default_factory=ChatTemplateTokens, title="Prompt Configuration", description="The configuration for the chat template tokens.");

class ModelCosts(BaseModel):
    input_token_cost_per_million: float = Field(0.0, title="Input Token Cost per Million", description="The cost per million tokens for input.")
    cached_input_token_cost_per_million: float = Field(0.0, title="Cached Input Token Cost per Million", description="The cost per million tokens for cached input.")
    output_token_cost_per_million: float = Field(0.0, title="Output Token Cost per Million", description="The cost per million tokens for output.")
    cost_per_unit: Optional[float] = Field(None, description="A generic field to capture the unit cost of this model. Unit will depend on the model type, like seconds (STT), characters (TTS), images, etc. For LLMs, use the other fields.")
      
class AliceModel(BaseDataStructure):
    short_name: str = Field(..., title="Short Name", description="The short name of the model.")
    model_name: str = Field(..., title="Model Name", description="The complete name of the model.")
    api_name: ApiName = Field(default='lm_studio', title="API name", description="The API to use for the model.")
    model_type: ModelType = Field(..., title="Model Type", description="The type of the model.")
    config_obj: ModelConfigObj = Field(default_factory=ModelConfigObj, title="Model Configuration", description="The configuration for the model.")
    model_costs: ModelCosts = Field(default_factory=ModelCosts, title="Model Costs", description="The costs for the model.")

class ModelConfig(ModelConfigObj):
    model: str
    api_key: Optional[str]
    base_url: Optional[str]
    model_costs: ModelCosts
    model_config = ConfigDict(protected_namespaces=())
    
    def model_dump(self, *args, **kwargs):
        # Ensure we exclude model_config from serialization
        kwargs['exclude'] = {
            'model_config', 
            *kwargs.get('exclude', set())
        }
        
        return super().model_dump(*args, **kwargs)

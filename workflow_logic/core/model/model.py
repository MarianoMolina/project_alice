
import os, tiktoken
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field, model_validator, ConfigDict, ValidationError
from guidance.models import LlamaCpp, OpenAI, Anthropic, Model as GuidanceModel
from guidance.chat import ChatTemplate
from workflow_logic.util.const import const_model_definitions, model_formats, active_vision_models, active_models, LOCAL_LLM_API_URL, HOST
from workflow_logic.util.utils import autogen_default_llm_config, model_path_from_file, LLMConfig

class AliceModel(BaseModel):
    short_name: str = Field(..., title="Short Name", description="The short name of the model.")
    model_name: str = Field(..., title="Model Name", description="The complete name of the model. For file-based models, this is folder path.")
    model_format: str = Field(..., title="Model Format", description="The format of the model.")
    ctx_size: int = Field(..., title="Context Size", description="The context size of the model.")
    model_type: Literal["instruct", "chat", "vision"] = Field(..., title="Model Type", description="The type of the model.")
    deployment: Literal["local", "remote"] = Field(..., title="Model Deployment", description="The deployment of the model.")
    model_file: Optional[str] = Field(None, title="Model File", description="Optional. The file of the model if it is local.")
    api_key: str = Field(default="lm-studio", title="API Key", description="Optional. The API key for the model.")
    port: int = Field(default=1234, title="Port", description="Optional. The port for the model for local models deployed through API-like endpoints.")
    api_type: str = Field(default="openai", title="API Type", description="Optional. The API type for the model.", examples=["openai", "azure", "anthropic"])
    base_url: str = Field(default=LOCAL_LLM_API_URL, title="Base URL", description="Optional. The base URL for the model. Necessary for remote models.")
    autogen_model_client_cls: Optional[str] = Field(None, title="Autogen Model Client Class", description="Optional. The class for the autogen model client if it is a custom client.")
    model_config = ConfigDict(protected_namespaces=())

    @model_validator(mode="after")
    def validate_deployment(self):
        if self.deployment == "remote":
            if not self.base_url:
                raise ValueError(f"Remote model needs a valid base URL. Base URL for {self.short_name} not found.")
            if not self.api_key:
                raise ValueError(f"Remote model needs a valid API key. API key for {self.short_name} not found.")
        elif self.deployment == "local":
            if not self.model_file:
                raise ValueError(f"Local model needs a valid file. Model file for {self.short_name} not found.")
            # Check if model file ends with .gguf
            if not os.path.exists(self.model_path):
                raise ValueError(f"Local model needs a valid path file. Model path {self.model_path} not found.")
            if not self.model_file.endswith(".gguf"):
                raise ValueError(f"Model file {self.model_file} must end with .gguf")
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
    def model_path(self) -> str:
        return model_path_from_file(self.model_file)
    
    @property
    def model_format_dict(self) -> Dict:
        return self.get_model_format_dict()
    
    @property
    def antiprompts(self) -> List[str]:
        return self.model_format_dict.get("antiprompt", [])
    
    @property
    def autogen_model_config(self) -> List[dict]:
        if self.deployment == "local":
            return self.get_autogen_model_config_local()
        elif self.deployment == "remote":
            return self.get_autogen_model_config_remote()
        
    @property
    def autogen_llm_config(self) -> LLMConfig:
        return autogen_default_llm_config(self.autogen_model_config)
    
    @property
    def guidance_model(self, verbose: bool = True) -> GuidanceModel:
        model_kwargs = {}
        guidance_class = self.get_formatted_guidance_class()
        if self.deployment == "local":
            model_kwargs = dict(n_ctx=self.ctx_size, 
                                n_threads=32, 
                                n_gpu_layers=-1, 
                                verbose=verbose,
                                offload_kqv=True, 
                                n_threads_batch=32
                                )
            llm = guidance_class(model=self.model_path, api_key = self.api_key, **model_kwargs)
        else:
            if "gpt-4o" in self.model_path:
                llm = guidance_class(model=self.model_path, api_key = self.api_key, tokenizer=tiktoken.get_encoding("cl100k_base"), **model_kwargs)
            else:
                llm = guidance_class(model=self.model_path, api_key = self.api_key, **model_kwargs)
        if "echo" in llm.__dict__:
            llm.echo = False

        return llm
    
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
        
    def get_formatted_guidance_class(self) -> GuidanceModel:
        if self.deployment == "remote":
            if self.api_type == "openai": 
                return OpenAI
            elif self.api_type == "anthropic":
                return Anthropic
            else: 
                raise Exception(f"API type {self.api_type} not found.")
        else:
            class ModelFormatInterface(LlamaCpp, ChatTemplate):
                def get_role_start(cls, role_name, **kwargs):
                    return self.get_role_start(role_name, **kwargs)
                def get_role_end(cls, role_name=None):
                    return self.get_role_end(role_name)
            return ModelFormatInterface
    
    def get_autogen_model_config_local(self) -> List[dict]:
        return [
            {
                "model": self.model_file,
                "base_url": f"http://{HOST}:{self.port}/v1",
                "api_key": self.api_key
            }
        ]
    
    def get_autogen_model_config_remote(self) -> List[dict]:
        config = {
            "model": self.model_name,
            "api_key": self.api_key,
            "base_url": self.base_url,
            "api_type": self.api_type
        }

        if self.autogen_model_client_cls is not None:
            config["model_client_cls"] = self.autogen_model_client_cls

        return [config]

class ModelManager(BaseModel):
    model_definitions: List[dict | AliceModel] = Field(const_model_definitions, title="Model Definitions", description="The model definitions. Can be passes as dict or AliceModel objects, after init they will be converted to AliceModel objects.")
    active_models: List[str] = Field(active_models, title="Active Models", description="The short_name of the models that are available for use. Place first the default model.")
    active_vision_models: List[str] = Field(active_vision_models, title="Vision Models", description="The short_name of the vision models that are available for use. Place first the default vision model.")
    model_config = ConfigDict(protected_namespaces=())

    @model_validator(mode="after")
    def validate_model_definitions(self):
        for model in self.model_definitions:
            if not isinstance(model, AliceModel):
                try:
                    model = AliceModel.model_validate(model)
                except ValidationError as e:
                    raise ValidationError(
                        f"Validation error in AliceModel: {str(e)}",
                        model=model,
                    )
        return self

    @property
    def available_models(self) -> List[str]:
        return [model.short_name for model in self.model_definitions]
    
    @property
    def default_model(self) -> AliceModel:
        model_def = self.get_model_obj_from_short_name(self.active_models[0])
        if not model_def:
            raise ValueError(f"Model {self.active_models[0]} not found.")
        return model_def
    
    @property
    def default_vision_model(self) -> AliceModel:
        model_def = self.get_model_obj_from_short_name(self.active_vision_models[0])
        if not model_def:
            raise ValueError(f"Model {self.active_vision_models[0]} not found.")
        return model_def
       
    def get_model_obj_from_short_name(self, short_name: str) -> AliceModel | None:
        matched_models = [model for model in self.model_definitions if model.short_name == short_name]
        if matched_models:
            return matched_models[0]
        else:
            return None
    
    def get_model_obj_from_name(self, name: str) -> AliceModel | None:
        matched_models = [model for model in self.model_definitions if model.short_name == name]
        if not matched_models:
            matched_models = [model for model in self.model_definitions if model.model_name == name]
        if not matched_models:
            matched_models = [model for model in self.model_definitions if model.model_file == name]
        if not matched_models:
            return None
        return matched_models[0]
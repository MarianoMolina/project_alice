from workflow_logic.util.const import HOST
from pydantic import BaseModel
from typing import Optional, List

class ModelConfig(BaseModel):
    model: str
    api_key: Optional[str]
    base_url: Optional[str] 
    api_type: Optional[str] 
    # model_client_cls: Optional[str] = None

class LLMConfig(BaseModel):
    config_list: List[ModelConfig]
    temperature: Optional[float] = 0.9
    timeout: Optional[int] = 300
    tools: Optional[List[str]] = None

    def replace_localhost(self) -> 'LLMConfig':
        for config in self.config_list:
            if "localhost" in config.base_url:
                config.base_url = config.base_url.replace("localhost", HOST)
        return self
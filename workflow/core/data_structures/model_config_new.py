from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class ModelConfig(BaseModel):
    model: str
    api_key: Optional[str]
    base_url: Optional[str]
    temperature: Optional[float] = 0.9
    timeout: Optional[int] = 300
    use_cache: Optional[bool] = False
    ctx_size: Optional[int] = 1024
    model_config = ConfigDict(protected_namespaces=())
    
    def model_dump(self, *args, **kwargs):
        # Ensure we exclude model_config from serialization
        kwargs['exclude'] = {
            'model_config', 
            *kwargs.get('exclude', set())
        }
        
        data = super().model_dump(*args, **kwargs)

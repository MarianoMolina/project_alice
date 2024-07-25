from typing import List, Dict, Any
from pydantic import BaseModel, Field

class InitializationModule(BaseModel):
    name: str
    dependencies: List[str] = Field(default_factory=list)
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)
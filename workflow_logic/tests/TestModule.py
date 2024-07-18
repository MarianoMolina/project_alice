from typing import Dict, Any
from pydantic import BaseModel

class TestModule(BaseModel):
    name: str

    async def run(self, **kwargs) -> Dict[str, Any]:
        raise NotImplementedError("Subclasses must implement run method")
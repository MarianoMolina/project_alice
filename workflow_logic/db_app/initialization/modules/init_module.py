from typing import List, Dict, Any
import pkgutil
from pydantic import BaseModel, Field

class InitializationModule(BaseModel):
    name: str
    dependencies: List[str] = Field(default_factory=list)
    data: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

    
def get_prompt_file(file_name):
    data = pkgutil.get_data('workflow_logic.db_app.prompts', file_name)
    if data:
        return data.decode('utf-8')
    else:
        raise FileNotFoundError(f"File {file_name} not found in the prompts directory")
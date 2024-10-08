from typing import Union, Dict, Any
from pydantic import BaseModel
from workflow_logic.core import AliceChat, AliceTask, APIManager

# Utility function for deep API availability check
async def deep_api_check(item: Union[AliceTask, AliceChat], api_manager: APIManager) -> Dict[str, Any]:
    if isinstance(item, AliceTask) or isinstance(item, AliceChat):
        return item.deep_validate_required_apis(api_manager)
    else:
        raise ValueError(f"Unsupported item type for API check: {type(item)}")
    
class TaskExecutionRequest(BaseModel):
    taskId: str
    inputs: Dict[str, Any]


from typing import Union, Dict, Any, Optional
from pydantic import BaseModel
from workflow.core import AliceChat, AliceTask, APIManager

# Utility function for deep API availability check
async def deep_api_check(item: Union[AliceTask, AliceChat], api_manager: APIManager) -> Dict[str, Any]:
    if isinstance(item, AliceTask) or isinstance(item, AliceChat):
        return item.deep_validate_required_apis(api_manager)
    else:
        raise ValueError(f"Unsupported item type for API check: {type(item)}")
    
class TaskExecutionRequest(BaseModel):
    taskId: str
    inputs: Dict[str, Any]

class ChatResponseRequest(BaseModel):
    chat_id: str

class ChatResumeRequest(BaseModel):
    """Request model for resuming a chat interaction."""
    interaction_id: str
    
class FileTranscriptRequest(BaseModel):
    file_id: str
    agent_id: Optional[str] = None
    chat_id: Optional[str] = None

class TaskResumeRequest(BaseModel):
    """Request model for resuming a task from a previous response."""
    task_response_id: str
    additional_inputs: dict = {}
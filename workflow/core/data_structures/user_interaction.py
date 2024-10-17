from typing import Optional, Union, Any, Dict
from pydantic import BaseModel, Field
from workflow.core.data_structures.base_models import BaseDataStructure

class UserResponse(BaseModel):
    selected_option: int
    user_feedback: Optional[str] = None

class UserInteraction(BaseDataStructure):
    user_prompt: str
    execution_history: Dict[str, Any]
    options_obj: Dict[int, str] = Field(default_factory=lambda: {0: "approve", 1: "reject"})
    user_response: Optional[UserResponse] = None
    task_next_obj: Dict[int, str]
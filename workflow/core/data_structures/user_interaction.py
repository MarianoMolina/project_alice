from typing import Optional, Any, Dict
from pydantic import BaseModel, Field
from workflow.core.data_structures.base_models import BaseDataStructure

class UserResponse(BaseModel):
    selected_option: int
    user_feedback: Optional[str] = None

    def __str__(self) -> str:
        return f"SelectedOption: {self.selected_option}\nUserFeedback: {self.user_feedback}"

class UserInteraction(BaseDataStructure):
    user_checkpoint_id: str
    task_response_id: Optional[str] = None
    user_response: Optional[UserResponse] = None

    def __str__(self) -> str:
        return f"UserCheckpointId: {self.user_checkpoint_id}\nTaskResponseId: {self.task_response_id}\nUserResponse: \n{str(self.user_response)}"

class UserCheckpoint(BaseDataStructure):
    user_prompt: str
    options_obj: Dict[int, str] = Field(default_factory=lambda: {0: "approve", 1: "reject"})
    task_next_obj: Dict[int, str]
    request_feedback: bool = Field(default=False, description="Request written feedback from user")
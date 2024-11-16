from enum import Enum
from typing import Optional, Any, Union
from pydantic import BaseModel, Field, field_validator
from workflow.core.data_structures.base_models import Embeddable
from workflow.core.data_structures.user_checkpoint import UserCheckpoint

class InteractionOwnerType(str, Enum):
    TASK_RESPONSE = "task_response"
    CHAT = "chat"

class InteractionOwner(BaseModel):
    type: InteractionOwnerType
    id: str

    @field_validator('id')
    @classmethod
    def validate_id(cls, value: Union[str, dict, Any]) -> str:
        if isinstance(value, str):
            return value
        
        if isinstance(value, dict):
            id_value = value.get('_id') or value.get('id')
            if id_value:
                return str(id_value)
        
        raise ValueError("Could not extract ID from owner. Expected string or object with '_id' or 'id' field")
    
class UserResponse(BaseModel):
    selected_option: int
    user_feedback: Optional[str] = None

    @field_validator('selected_option')
    @classmethod
    def validate_selected_option(cls, value: int) -> int:
        if value < 0:
            raise ValueError("Selected option must be a non-negative integer")
        return value

    def __str__(self) -> str:
        return f"SelectedOption: {self.selected_option}\nUserFeedback: {self.user_feedback if self.user_feedback else 'No feedback from the user'}"

class UserInteraction(Embeddable):
    """
    Represents a user interaction that can belong to either a task response or a chat.
    """
    user_checkpoint_id: UserCheckpoint = Field(..., description="The id of the user checkpoint")
    owner: Optional[InteractionOwner] = Field(None, description="Owner (task response or chat) of this interaction")
    user_response: Optional[UserResponse] = None

    def __str__(self) -> str:
        string = ''
        if self.owner:
            string += f"Owner: {self.owner.type}:{self.owner.id}\n"
        string += f"UserCheckpointId: {self.user_checkpoint_id.id}\n"
        if self.user_response:
            string += f"UserResponse: \n{str(self.user_response)}"
        else:
            string += "UserResponse: None"
        return string
    
    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        data['user_checkpoint_id'] = self.user_checkpoint_id.model_dump(*args, **kwargs)
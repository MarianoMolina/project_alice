from enum import Enum
from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator, ValidationInfo
from workflow.core.data_structures.base_models import Embeddable, BaseDataStructure

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
    
class UserCheckpoint(BaseDataStructure):
    user_prompt: str = Field(..., description="The prompt to show to the user")
    options_obj: Dict[int, str] = Field(
        default_factory=lambda: {0: "approve", 1: "reject"},
        description="Dictionary mapping option IDs to their descriptions"
    )
    task_next_obj: Dict[int, str] = Field(
        ...,
        description="Dictionary mapping option IDs to next task identifiers"
    )
    request_feedback: bool = Field(
        default=False,
        description="Request written feedback from user"
    )

    @field_validator('task_next_obj')
    @classmethod
    def validate_task_next_obj(cls, value: Dict[int, str], info: ValidationInfo) -> Dict[int, str]:
        options_obj = info.data.get('options_obj', {})
        if not all(key in options_obj for key in value.keys()):
            raise ValueError("All keys in task_next_obj must exist in options_obj")
        return value

    @field_validator('options_obj')
    @classmethod
    def validate_options_obj(cls, value: Dict[int, str]) -> Dict[int, str]:
        if not value:
            raise ValueError("options_obj cannot be empty")
        if not all(isinstance(k, int) for k in value.keys()):
            raise ValueError("All keys in options_obj must be integers")
        return value
    
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
    owner: InteractionOwner = Field(..., description="Owner (task response or chat) of this interaction")
    user_response: Optional[UserResponse] = None

    def __str__(self) -> str:
        return (f"Owner: {self.owner.type}:{self.owner.id}\n"
                f"UserCheckpointId: {self.user_checkpoint_id.id}\n"
                f"UserResponse: \n{str(self.user_response)}")

    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        data['user_checkpoint_id'] = self.user_checkpoint_id.model_dump(*args, **kwargs)

    @field_validator('task_response_id')
    @classmethod
    def validate_task_response_id(cls, value: Optional[Union[str, dict, Any]]) -> Optional[str]:
        if value is None:
            return value
        
        if isinstance(value, str):
            return value
            
        if isinstance(value, dict):
            # Try to get '_id' or 'id' from the dictionary
            id_value = value.get('_id') or value.get('id')
            if id_value:
                return str(id_value)
                
        raise ValueError("Could not extract ID from task_response_id. Expected string, None, or object with '_id' or 'id' field")
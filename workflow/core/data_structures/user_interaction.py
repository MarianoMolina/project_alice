from enum import Enum
from typing import Optional, Any, Union, Annotated
from pydantic import BaseModel, Field, field_validator
from workflow.core.data_structures.base_models import Embeddable
from workflow.core.data_structures.user_checkpoint import UserCheckpoint

class InteractionOwnerType(str, Enum):
    TASK_RESPONSE = "task_response"
    CHAT = "chat"

class BaseOwner(BaseModel):
    type: InteractionOwnerType

    model_config = {'extra':'forbid'}

class TaskResponseOwner(BaseOwner):
    type: InteractionOwnerType = InteractionOwnerType.TASK_RESPONSE
    task_result_id: str

    @field_validator('task_result_id')
    @classmethod
    def validate_task_result_id(cls, value: Union[str, dict, Any]) -> str:
        if isinstance(value, str):
            return value
        
        if isinstance(value, dict):
            id_value = value.get('_id') or value.get('id')
            if id_value:
                return str(id_value)
        
        raise ValueError("Could not extract task_result_id. Expected string or object with '_id' or 'id' field")
    
class ChatOwner(BaseOwner):
    type: InteractionOwnerType = InteractionOwnerType.CHAT
    chat_id: str
    thread_id: str

    @field_validator('chat_id', 'thread_id')
    @classmethod
    def validate_id(cls, value: Union[str, dict, Any]) -> str:
        if isinstance(value, str):
            return value
        
        if isinstance(value, dict):
            id_value = value.get('_id') or value.get('id')
            if id_value:
                return str(id_value)
        
        raise ValueError("Could not extract ID. Expected string or object with '_id' or 'id' field")

InteractionOwner = Annotated[Union[TaskResponseOwner, ChatOwner], Field(discriminator='type')]
    
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
            if isinstance(self.owner, ChatOwner):
                string += f"Owner: {self.owner.type}:{self.owner.chat_id} (thread: {self.owner.thread_id})\n"
            else:
                string += f"Owner: {self.owner.type}:{self.owner.task_result_id}\n"
        string += f"UserCheckpointId: {self.user_checkpoint_id.id}\n"
        if self.user_response:
            string += f"UserResponse: \n{str(self.user_response)}"
        else:
            string += "UserResponse: None"
        return string
    
    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        data['user_checkpoint_id'] = self.user_checkpoint_id.model_dump(*args, **kwargs)
        return data
    
    @field_validator('owner')
    @classmethod
    def validate_owner(cls, value: Any) -> Optional[Union[TaskResponseOwner, ChatOwner]]:
        if value is None:
            return None
            
        if isinstance(value, (TaskResponseOwner, ChatOwner)):
            return value
            
        if isinstance(value, dict):
            owner_type = value.get('type')
            if owner_type == InteractionOwnerType.CHAT:
                return ChatOwner(**value)
            return TaskResponseOwner(**value)
            
        raise ValueError("Invalid owner format")
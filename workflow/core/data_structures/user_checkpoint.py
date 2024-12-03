from typing import Dict, Union
from pydantic import Field, field_validator, ValidationInfo
from workflow.core.data_structures.base_models import BaseDataStructure
    
class UserCheckpoint(BaseDataStructure):
    user_prompt: str = Field(..., description="The prompt to show to the user")
    options_obj: Dict[int, str] = Field(
        default_factory=lambda: {0: "approve", 1: "reject"},
        description="Dictionary mapping option IDs to their descriptions"
    )
    task_next_obj: Dict[int, Union[str, None]] = Field(
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
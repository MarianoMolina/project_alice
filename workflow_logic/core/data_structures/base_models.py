from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum
# The order of this list is used to determine which entities are created first
EntityType = Literal["users", "models", "apis", "parameters", "prompts", "agents", "tasks", "chats", "task_responses", "files"]

class FileType(str, Enum):
    IMAGE = 'image'
    AUDIO = 'audio'
    VIDEO = 'video'
    FILE = 'file'

class ContentType(str, Enum):
    @classmethod
    def _missing_(cls, value):
        try:
            return FileType(value)
        except ValueError:
            raise ValueError(f"{value} is not a valid {cls.__name__}")

    @classmethod
    def _create_contenttype(cls):
        # Start with all FileType members
        members = {name: value.value for name, value in FileType.__members__.items()}
        # Add new ContentType-specific members
        members.update({
            'TASK_RESPONSE': 'task_response',
            'MULTIPLE': 'multiple',
            'TEXT': 'text',
        })
        return Enum(cls.__name__, members, type=str)

ContentType = ContentType._create_contenttype()

class BaseDataStructure(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
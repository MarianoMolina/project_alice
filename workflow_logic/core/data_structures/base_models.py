from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum
# The order of this list is used to determine which entities are created first
EntityType = Literal["users", "models", "apis", "parameters", "prompts", "agents", "tasks", "chats", "task_responses", "files", "messages", "urlreferences"]

class FileType(str, Enum):
    IMAGE = 'image'
    AUDIO = 'audio'
    VIDEO = 'video'
    FILE = 'file'

class ContentType(str, Enum):
    IMAGE = FileType.IMAGE
    AUDIO = FileType.AUDIO
    VIDEO = FileType.VIDEO
    FILE = FileType.FILE
    TEXT = 'text'
    TASK_RESULT = 'task_result'
    URL_REFERENCE = 'url_reference'
    MULTIPLE = 'multiple'

class BaseDataStructure(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class FileType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    FILE = "file"
    TASK_RESPONSE = 'task_result'
    MULTIPLE = 'multiple'

class BaseDataStructure(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
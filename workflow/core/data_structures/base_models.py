from pydantic import BaseModel, Field
from typing import Optional, Literal, Tuple, Union, Dict, List
from enum import Enum
# The order of this list is used to determine which entities are created first
# Also modify the collection_map in db.py if you add new entities
# As well as the init_manager.py dictionaries
EntityType = Literal["users", "models", "apis", "parameters", "prompts", "user_checkpoints", "agents", "tasks", "chats", "task_responses", "files", "messages", "urlreferences", "user_interactions", "embedding_chunks", "data_clusters"]

class FileType(str, Enum):
    IMAGE = 'image'
    AUDIO = 'audio'
    VIDEO = 'video'
    FILE = 'file'

class ContentType(str, Enum):
    IMAGE = FileType.IMAGE.value
    AUDIO = FileType.AUDIO.value
    VIDEO = FileType.VIDEO.value
    FILE = FileType.FILE.value
    TEXT = 'text'
    TASK_RESULT = 'task_result'
    URL_REFERENCE = 'url_reference'
    MULTIPLE = 'multiple'

RouteMapTuple = Tuple[Union[str, None], bool]
RouteMap = Dict[int, RouteMapTuple]
TasksEndCodeRouting = Dict[str, RouteMap]

class BaseDataStructure(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    # created_by: Optional[Any] = Field(default=None)
    # updated_by: Optional[Any] = Field(default=None)
    createdAt: Optional[str] = Field(default=None)
    updatedAt: Optional[str] = Field(default=None)

class EmbeddingChunk(BaseDataStructure):
    vector: List[float] = Field(..., description="The embedding vector")
    text_content: str = Field(..., description="The text content that the embedding vector represents")
    index: int = Field(..., description="The index of the embedding chunk in the original text")
    creation_metadata: dict = Field(default_factory=dict, description="Metadata about the creation of the embedding")

class Embeddable(BaseDataStructure):
    embedding: Optional[List[EmbeddingChunk]] = Field(None, description="The embedding chunks for the file content")
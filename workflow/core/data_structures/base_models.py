from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Optional, Literal, Tuple, Union, Dict, List
from enum import Enum
from workflow.util import LOGGER, get_traceback
# The order of this list is used to determine which entities are created first
# Also modify the collection_map in db.py if you add new entities
# As well as the init_manager.py dictionaries
EntityType = Literal["users", "models", "api_configs", "apis", "parameters", "prompts", "user_checkpoints", "agents", "tasks", "chats", "task_responses", "files", "messages", "user_interactions", "embedding_chunks", "data_clusters", "tool_calls", "code_executions"]

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
    ENTITY_REFERENCE = 'entity_reference'
    MULTIPLE = 'multiple'
    CODE_EXECUTION = 'code_execution'

RouteMapTuple = Tuple[Union[str, None], bool]
RouteMap = Dict[int, RouteMapTuple]
TasksEndCodeRouting = Dict[str, RouteMap]

class BaseDataStructure(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    # createdAt: Optional[str] = Field(default=None)
    # updatedAt: Optional[str] = Field(default=None)
    
    model_config = {
        "protected_namespaces": (),
        "json_encoders": {ObjectId: str},
        "arbitrary_types_allowed": True,
        "extra": "allow"
    }
    
    def model_dump(self, *args, **kwargs):
        LOGGER.debug(f"BaseDataStructure.model_dump called for {self.__class__.__name__}")
        
        # Inspect all class-level attributes
        class_vars = vars(self.__class__)
            
        kwargs['exclude'] = {
            'model_config', 
            # '__pydantic_private__',
            # '__pydantic_extra__',   
            # '__pydantic_fields_set__',
            # '__pydantic_core_schema__',
            # '__pydantic_validator__',
            # '__pydantic_serializer__',
            # '__pydantic_custom_init__',
            # '__pydantic_post_init__',
            # '__pydantic_decorators__',
            # '__pydantic_generic_metadata__',
            # '__pydantic_complete__',
            # '__pydantic_parent_namespace__',
            # 'model_fields',
            # 'model_computed_fields',
            # '__private_attributes__',
            # '__abstractmethods__',
            # '__class_vars__',
            *kwargs.get('exclude', set())
        }

        LOGGER.debug(f"Dumping model {self.__class__.__name__} with kwargs {kwargs}")
        
        try:
            data = super().model_dump(*args, **kwargs)
            if self.id is None:
                data.pop('id', None)
                data.pop('_id', None)
            return data
        except TypeError as e:
            LOGGER.error(f"TypeError in {self.__class__.__name__} model_dump: {str(e)}")
            LOGGER.error(f"Failed while processing class vars: {list(class_vars.keys())}")
            LOGGER.error(f'Traceback: {get_traceback()}')
            raise

class EmbeddingChunk(BaseDataStructure):
    vector: List[float] = Field(..., description="The embedding vector")
    text_content: str = Field(..., description="The text content that the embedding vector represents")
    index: int = Field(..., description="The index of the embedding chunk in the original text")
    creation_metadata: dict = Field(default_factory=dict, description="Metadata about the creation of the embedding")

class Embeddable(BaseDataStructure):
    embedding: Optional[List[EmbeddingChunk]] = Field(None, description="The embedding chunks for the file content")
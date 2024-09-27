from __future__ import annotations
from datetime import datetime
from typing import Dict, Any, List, TYPE_CHECKING
from pydantic import BaseModel, Field, model_validator, field_validator
from workflow_logic.core.data_structures.base_models import BaseDataStructure
from workflow_logic.core.data_structures.central_types import MessageDictType, TaskResponseType, FileContentReferenceType

if TYPE_CHECKING:
    from workflow_logic.core.data_structures.message import MessageDict
    from workflow_logic.core.data_structures.task_response import TaskResponse
    from workflow_logic.core.data_structures.file_reference import FileContentReference

class OutputInterface(BaseDataStructure):
    content: List[Any] = Field([], description="The content of the output.")

    @property
    def output_type(self) -> str:
        return self.__class__.__name__
   
    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        data['output_type'] = self.output_type
        
        if isinstance(self.content, list):
            data['content'] = [
                item.model_dump(*args, **kwargs) if isinstance(item, BaseModel) else item
                for item in self.content
            ]
        elif isinstance(self.content, BaseModel):
            data['content'] = self.content.model_dump(*args, **kwargs)
        
        return data
   
    def __str__(self) -> str:
        return str(self.content)

class StringOutput(OutputInterface):
    content: List[str] = Field([], description="The content of the output.")

    def __str__(self) -> str:
        return "\n".join(self.content)
    
    @field_validator('content')
    def validate_content(cls, v):
        return [str(item) for item in v]

class LLMChatOutput(OutputInterface):
    content: List[MessageDictType] = Field([], description="List of messages in the chat conversation")

    def __str__(self) -> str:
        return "\n".join(
            [f"{message.role}: " + (f"{message.assistant_name}\n" if message.assistant_name else "\n") + message.content
             for message in self.content]
        )
    
    @field_validator('content')
    def validate_content(cls, v):
        from workflow_logic.core.data_structures.message import MessageDict
        return [MessageDict(**item) if not isinstance(item, MessageDict) else item for item in v]

class SearchResult(BaseDataStructure):
    title: str
    url: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode='before')
    def sanitize_metadata(cls, values):
        sanitized_metadata = {}
        metadata = values.get('metadata', {})
        for key, val in metadata.items():
            try:
                if isinstance(val, datetime):
                    sanitized_metadata[key] = val.isoformat()
                else:
                    sanitized_metadata[key] = str(val)
            except Exception as e:
                print(f"Error serializing value for key {key}: {val}, Exception: {e}")
                sanitized_metadata[key] = "Unserializable value"
        values['metadata'] = sanitized_metadata
        return values

class SearchOutput(OutputInterface):
    content: List[SearchResult] = Field([], description="List of search results")

    @field_validator('content')
    def validate_content(cls, v):
        return [SearchResult(**item) if not isinstance(item, SearchResult) else item for item in v]
    
    def __str__(self) -> str:
        return "\n".join(
            [f"Title: {result.title} \nURL: {result.url} \n Content: {result.content}\n"
             for result in self.content]
        )

class WorkflowOutput(OutputInterface):
    content: List[TaskResponseType] = Field([], description="The task responses performed by the workflow.")

    def __str__(self) -> str:
        return "\n".join([f"{task.task_name}: {task.task_description}\nTask Output:{str(task.task_outputs)}" for task in self.content])
    
    @field_validator('content')
    def validate_content(cls, v):
        from workflow_logic.core.data_structures.task_response import TaskResponse
        return [TaskResponse(**item) if not isinstance(item, TaskResponse) else item for item in v]
    
class FileOutput(OutputInterface):
    content: List[FileContentReferenceType | FileContentReferenceType] = Field([], description="The file content references.")

    def __str__(self) -> str:
        return "\n".join([f"File: {file_ref.file_name}:\nTranscript: {file_ref.transcript.content}" for file_ref in self.content])
    
    @field_validator('content')
    def validate_content(cls, v):
        from workflow_logic.core.data_structures.file_reference import FileContentReference, FileReference
        # Validate the content as either FileContentReference or FileReference
        # If no content, its FileReference, else FileContentReference
        return [
            item if isinstance(item, FileReference) else FileContentReference(**item) if 'content' in item else FileReference(**item)
            for item in v
        ]
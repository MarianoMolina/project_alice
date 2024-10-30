from typing import List, Optional, Union, Any, Dict
from pydantic import BaseModel, Field
from workflow.core.data_structures.message import MessageDict
from workflow.core.data_structures.file_reference import FileReference, FileContentReference
from workflow.core.data_structures.task_response import TaskResponse
from workflow.core.data_structures.url_reference import URLReference
from workflow.core.data_structures.user_interaction import UserInteraction
from workflow.core.data_structures.base_models import EmbeddingChunk

class References(BaseModel):
    messages: Optional[List[MessageDict]] = Field(default=None, description="List of message references")
    files: Optional[List[Union[FileReference, FileContentReference]]] = Field(default=None, description="List of file references")
    task_responses: Optional[List[TaskResponse]] = Field(default=None, description="List of task response references")
    url_references: Optional[List[URLReference]] = Field(default=None, description="List of search result references")
    string_outputs: Optional[List[str]] = Field(default=None, description="List of string output references")
    user_interactions: Optional[List[UserInteraction]] = Field(default=None, description="List of user interaction references")
    embeddings: Optional[List[EmbeddingChunk]] = Field(default=None, description="List of embedding references")

    def model_dump(self, *args, **kwargs) -> Dict[str, Any]:
        data = super().model_dump(*args, **kwargs)
        for key in ['messages', 'files', 'task_responses', 'url_references', 'string_outputs', 'user_interactions']:
            if getattr(self, key) is not None:
                data[key] = [
                    item.model_dump(*args, **kwargs) if isinstance(item, BaseModel)
                    else item if isinstance(item, str)
                    else None
                    for item in getattr(self, key)
                    if isinstance(item, (BaseModel, str))
                ]
        return data

    def add_reference(self, reference: Union[MessageDict, FileReference, FileContentReference, TaskResponse, URLReference, str, UserInteraction]):
        """Add a reference to the appropriate list based on its type."""
        if isinstance(reference, MessageDict):
            if self.messages is None:
                self.messages = []
            self.messages.append(reference)
        elif isinstance(reference, (FileReference, FileContentReference)):
            if self.files is None:
                self.files = []
            self.files.append(reference)
        elif isinstance(reference, TaskResponse):
            if self.task_responses is None:
                self.task_responses = []
            self.task_responses.append(reference)
        elif isinstance(reference, URLReference):
            if self.url_references is None:
                self.url_references = []
            self.url_references.append(reference)
        elif isinstance(reference, str):
            if self.string_outputs is None:
                self.string_outputs = []
            self.string_outputs.append(reference)
        elif isinstance(reference, UserInteraction):
            if self.user_interactions is None:
                self.user_interactions = []
            self.user_interactions.append(reference)
        else:
            raise ValueError(f"Unsupported reference type: {type(reference)}")

    def get_references(self, ref_type: Optional[str] = None) -> Union[List[Any], Dict[str, List[Any]]]:
        """Get references of a specific type or all references."""
        if ref_type is None:
            return {
                "messages": self.messages,
                "files": self.files,
                "task_responses": self.task_responses,
                "url_references": self.url_references,
                "string_outputs": self.string_outputs,
                "user_interactions": self.user_interactions,
            }
        return getattr(self, ref_type, None)

    def remove_reference(self, reference: Union[MessageDict, FileReference, FileContentReference, TaskResponse, URLReference, str, UserInteraction]) -> bool:
        """Remove a specific reference."""
        for attr in ['messages', 'files', 'task_responses', 'url_references', 'string_outputs', 'user_interactions']:
            ref_list = getattr(self, attr)
            if ref_list is not None and reference in ref_list:
                ref_list.remove(reference)
                return True
        return False

    def clear_references(self, ref_type: Optional[str] = None):
        """Clear all references or references of a specific type."""
        if ref_type is None:
            self.messages = None
            self.files = None
            self.task_responses = None
            self.url_references = None
            self.string_outputs = None
            self.user_interactions = None
        else:
            setattr(self, ref_type, None)

    def summary(self) -> str:
        """Provide a summary of the references."""
        summary_parts = []
        for attr, value in self.__dict__.items():
            if value is not None and len(value) > 0:
                summary_parts.append(f"{attr.capitalize()}: {len(value)}")
        return ", ".join(summary_parts)

    def detailed_summary(self) -> str:
        """Provide a detailed summary of the references."""
        detailed_summary = []
        for attr, value in self.__dict__.items():
            if value is not None and len(value) > 0:
                for i, item in enumerate(value, 1):
                    detailed_summary.append(f"[{attr.capitalize()}:{i}/{len(value)}] {str(item)}")
        return " ".join(detailed_summary)

    def __bool__(self) -> bool:
        return any(value is not None and len(value) > 0 for value in self.__dict__.values() if isinstance(value, list))

    def __str__(self) -> str:
        return self.detailed_summary()

    def __len__(self) -> int:
        return sum(len(value) if value else 0 for value in self.__dict__.values() if isinstance(value, list))
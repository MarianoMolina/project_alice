from typing import List, Optional, Union, Any, Dict
from pydantic import BaseModel, Field
from workflow.core.data_structures.message import MessageDict
from workflow.core.data_structures.file_reference import FileReference, FileContentReference
from workflow.core.data_structures.task_response import TaskResponse
from workflow.core.data_structures.url_reference import URLReference

class References(BaseModel):
    messages: Optional[List[MessageDict]] = Field(default=None, description="List of message references")
    files: Optional[List[Union[FileReference, FileContentReference]]] = Field(default=None, description="List of file references")
    task_responses: Optional[List[TaskResponse]] = Field(default=None, description="List of task response references")
    search_results: Optional[List[URLReference]] = Field(default=None, description="List of search result references")
    string_outputs: Optional[List[str]] = Field(default=None, description="List of string output references")

    def model_dump(self, *args, **kwargs) -> Dict[str, Any]:
        data = super().model_dump(*args, **kwargs)
        for key in ['messages', 'files', 'task_responses', 'search_results', 'string_outputs']:
            if getattr(self, key) is not None:
                data[key] = [
                    item.model_dump(*args, **kwargs) if isinstance(item, BaseModel)
                    else item if isinstance(item, str)
                    else None
                    for item in getattr(self, key)
                    if isinstance(item, (BaseModel, str))
                ]

        return data

    def add_reference(self, reference: Union[MessageDict, FileReference, FileContentReference, TaskResponse, URLReference, str]):
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
            if self.search_results is None:
                self.search_results = []
            self.search_results.append(reference)
        elif isinstance(reference, str):
            if self.string_outputs is None:
                self.string_outputs = []
            self.string_outputs.append(reference)
        else:
            raise ValueError(f"Unsupported reference type: {type(reference)}")

    def get_references(self, ref_type: Optional[str] = None) -> Union[List[Any], Dict[str, List[Any]]]:
        """Get references of a specific type or all references."""
        if ref_type is None:
            return {
                "messages": self.messages,
                "files": self.files,
                "task_responses": self.task_responses,
                "search_results": self.search_results,
                "string_outputs": self.string_outputs,
            }
        return getattr(self, ref_type, None)

    def remove_reference(self, reference: Union[MessageDict, FileReference, FileContentReference, TaskResponse, URLReference, str]) -> bool:
        """Remove a specific reference."""
        for attr in ['messages', 'files', 'task_responses', 'search_results', 'string_outputs']:
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
            self.search_results = None
            self.string_outputs = None
        else:
            setattr(self, ref_type, None)

    def __bool__(self) -> bool:
        return any(value is not None and len(value) > 0 for value in self.__dict__.values() if isinstance(value, list))

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

    def __str__(self) -> str:
        return self.summary()

    def __len__(self) -> int:
        return sum(len(value) if value else 0 for value in self.__dict__.values() if isinstance(value, list))
    
    def get_complete_references(self) -> 'References':
        complete_refs = References()

        def collect_nested_references(ref):
            if isinstance(ref, MessageDict):
                complete_refs.add_reference(ref)
                if ref.references:
                    ref.references.get_complete_references()
            elif isinstance(ref, TaskResponse):
                complete_refs.add_reference(ref)
                if ref.references:
                    ref.references.get_complete_references()
            elif isinstance(ref, (FileReference, FileContentReference)):
                complete_refs.add_reference(ref)
                if hasattr(ref, 'transcript') and ref.transcript:
                    collect_nested_references(ref.transcript)
            elif isinstance(ref, (URLReference, str)):
                complete_refs.add_reference(ref)

        for ref_list in self.__dict__.values():
            if ref_list:
                for ref in ref_list:
                    collect_nested_references(ref)

        return complete_refs
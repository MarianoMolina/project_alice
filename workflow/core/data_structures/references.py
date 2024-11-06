from typing import List, Optional, Union, Any, Dict
from pydantic import BaseModel, Field, field_validator
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

    @field_validator('messages', 'files', 'task_responses', 'url_references', 'user_interactions', 'embeddings')
    @classmethod
    def validate_reference_list(cls, value: Optional[List[Union[Dict, BaseModel]]], info: Any) -> Optional[List[Any]]:
        if value is None:
            return None

        # Get the appropriate model class based on the field name
        model_map = {
            'messages': MessageDict,
            'task_responses': TaskResponse,
            'url_references': URLReference,
            'user_interactions': UserInteraction,
            'embeddings': EmbeddingChunk
        }
        
        if info.field_name == 'files':
            validated_items = []
            for item in value:
                if isinstance(item, (FileReference, FileContentReference)):
                    validated_items.append(item)
                elif isinstance(item, dict):
                    # If it has content, it's a FileContentReference, otherwise FileReference
                    model_class = FileContentReference if 'content' in item else FileReference
                    validated_items.append(model_class(**item))
                else:
                    raise ValueError(f"Invalid file reference format: {item}")
            return validated_items
            
        model_class = model_map.get(info.field_name)
        if not model_class:
            return value

        validated_items = []
        for item in value:
            if isinstance(item, dict):
                validated_items.append(model_class(**item))
            elif isinstance(item, model_class):
                validated_items.append(item)
            else:
                raise ValueError(f"Invalid {info.field_name} format: {item}")

        return validated_items
    
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
        for attr in ['messages', 'files', 'task_responses', 'url_references', 'string_outputs', 'user_interactions', 'embeddings']:
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
    
    def __eq__(self, other: Any) -> bool:
        """
        Compare two References objects for equality.
        Two References objects are considered equal if they have the same content
        in their respective fields, regardless of order.
        """
        if not isinstance(other, References):
            return False
            
        # Compare each field
        fields_to_compare = [
            'messages', 'files', 'task_responses', 'url_references', 
            'string_outputs', 'user_interactions', 'embeddings'
        ]
        
        for field in fields_to_compare:
            self_items = getattr(self, field) or []
            other_items = getattr(other, field) or []
            
            # If one is None and the other isn't, they're not equal
            if bool(self_items) != bool(other_items):
                return False
                
            # If both are None or empty, continue to next field
            if not self_items and not other_items:
                continue
                
            # Compare lengths
            if len(self_items) != len(other_items):
                return False
                
            # For string outputs, compare sets
            if field == 'string_outputs':
                if set(self_items) != set(other_items):
                    return False
                continue
                
            # For other fields, compare the actual objects
            # Convert to sets of their string representations for order-independent comparison
            self_set = {str(item) for item in self_items}
            other_set = {str(item) for item in other_items}
            if self_set != other_set:
                return False
                
        return True

    def is_subset(self, other: 'References') -> bool:
        """
        Check if this References object is a subset of another References object.
        """
        if not isinstance(other, References):
            return False
            
        for field in self.__fields__:
            self_items = getattr(self, field) or []
            other_items = getattr(other, field) or []
            
            # If this field is empty in self, continue
            if not self_items:
                continue
                
            # If self has items but other doesn't, it can't be a subset
            if not other_items:
                return False
                
            # For string outputs, use set operations
            if field == 'string_outputs':
                if not set(self_items).issubset(set(other_items)):
                    return False
                continue
                
            # For other fields, compare the actual objects
            self_set = {str(item) for item in self_items}
            other_set = {str(item) for item in other_items}
            if not self_set.issubset(other_set):
                return False
                
        return True
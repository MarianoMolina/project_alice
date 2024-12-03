from typing import List, Optional, Union, Any, Dict
from pydantic import BaseModel, Field, field_validator
from workflow.core.data_structures.base_models import BaseDataStructure
from workflow.core.data_structures.message import MessageDict
from workflow.core.data_structures.file_reference import FileReference, FileContentReference
from workflow.core.data_structures.task_response import TaskResponse
from workflow.core.data_structures.user_interaction import UserInteraction
from workflow.core.data_structures.base_models import EmbeddingChunk
from workflow.core.data_structures.tool_calls import ToolCall
from workflow.core.data_structures.code import CodeExecution
from workflow.core.data_structures.entity_reference import EntityReference

references_model_map = {
    'messages': MessageDict,
    'task_responses': TaskResponse,
    'entity_references': EntityReference,
    'user_interactions': UserInteraction,
    'embeddings': EmbeddingChunk,
    'code_executions': CodeExecution,
    'tool_calls': ToolCall,
    'files': FileReference | FileContentReference,
}

def get_file_object(file_dict: Union[Dict[str, Any], FileContentReference, FileReference]) -> Union[FileReference, FileContentReference]:
    """Get the appropriate file reference object based on the input dictionary."""
    if isinstance(file_dict, (FileReference, FileContentReference)):
        return file_dict
    elif isinstance(file_dict, dict):
        # If it has content, it's a FileContentReference, otherwise FileReference
        model_class = FileContentReference if 'content' in file_dict else FileReference
        return model_class(**file_dict)
    else:
        raise ValueError(f"Invalid file reference format: {file_dict}")
    
def get_reference_object(dict: Union[Dict[str, Any], Any], field_name: str) -> BaseModel | Any:
    """Get the appropriate reference object based on the field name. If not a reference object, returns the value"""
    if field_name == 'files':
        return get_file_object(dict)
    model_class = references_model_map.get(field_name)
    if not model_class:
        return dict
    if isinstance(dict, model_class):
        return dict
    elif isinstance(dict, dict):
        return model_class(**dict)
    else:
        raise ValueError(f"Invalid {model_class.__name__} format: {dict} - type: {type(dict)}")
    
class References(BaseModel):
    messages: Optional[List[MessageDict]] = Field(default=None, description="List of message references")
    files: Optional[List[Union[FileReference, FileContentReference]]] = Field(default=None, description="List of file references")
    task_responses: Optional[List[TaskResponse]] = Field(default=None, description="List of task response references")
    user_interactions: Optional[List[UserInteraction]] = Field(default=None, description="List of user interaction references")
    embeddings: Optional[List[EmbeddingChunk]] = Field(default=None, description="List of embedding references")
    code_executions: Optional[List[CodeExecution]] = Field(default=None, description="List of code execution references")
    tool_calls: Optional[List[ToolCall]] = Field(default=None, description="List of tool call references")
    entity_references: Optional[List[EntityReference]] = Field(default=None, description="List of entity references")

    @field_validator('messages', 'files', 'task_responses', 'entity_references', 'user_interactions', 'embeddings', 'code_executions', 'tool_calls')
    @classmethod
    def validate_reference_list(cls, value: Optional[List[Union[Dict, BaseModel]]], info: Any) -> Optional[List[Any]]:
        if value is None:
            return None

        validated_items = []
        for item in value:
            validated_items.append(get_reference_object(item, info.field_name))

        return validated_items

    def model_dump(self, *args, **kwargs) -> Dict[str, Any]:
        data = super().model_dump(*args, **kwargs)
        for key in references_model_map.keys():
            if getattr(self, key) is not None:
                data[key] = [
                    item.model_dump(*args, **kwargs) if isinstance(item, BaseModel)
                    else None
                    for item in getattr(self, key)
                    if isinstance(item, (BaseModel, str))
                ]
        return data

    def add_reference(self, reference: Union[MessageDict, FileReference, FileContentReference, TaskResponse, EntityReference, UserInteraction, EmbeddingChunk, CodeExecution, ToolCall]):
        """Add a reference to the appropriate list based on its type."""
        if isinstance(reference, MessageDict):
            if self.messages is None: self.messages = []
            self.messages.append(reference)
        elif isinstance(reference, (FileReference, FileContentReference)):
            if self.files is None: self.files = []
            self.files.append(reference)
        elif isinstance(reference, TaskResponse):
            if self.task_responses is None: self.task_responses = []
            self.task_responses.append(reference)
        elif isinstance(reference, EntityReference):
            if self.entity_references is None: self.entity_references = []
            self.entity_references.append(reference)
        elif isinstance(reference, UserInteraction):
            if self.user_interactions is None: self.user_interactions = []
            self.user_interactions.append(reference)
        elif isinstance(reference, EmbeddingChunk):
            if self.embeddings is None: self.embeddings = []
            self.embeddings.append(reference)
        elif isinstance(reference, CodeExecution):
            if self.code_executions is None: self.code_executions = []
            self.code_executions.append(reference)
        elif isinstance(reference, ToolCall):
            if self.tool_calls is None: self.tool_calls = []
            self.tool_calls.append(reference)
        else:
            raise ValueError(f"Unsupported reference type: {type(reference)}")

    def get_references(self, ref_type: Optional[str] = None) -> Union[List[BaseModel], Dict[str, List[BaseModel]]]:
        """Get references of a specific type or all references."""
        if ref_type is None:
            return {
                "messages": self.messages,
                "files": self.files,
                "task_responses": self.task_responses,
                "entity_references": self.entity_references,
                "user_interactions": self.user_interactions,
                "embeddings": self.embeddings,
                "code_executions": self.code_executions,
                "tool_calls": self.tool_calls,
            }
        return getattr(self, ref_type, None)

    def remove_reference(self, reference: Union[MessageDict, FileReference, FileContentReference, TaskResponse, EntityReference, UserInteraction, EmbeddingChunk, CodeExecution, ToolCall]) -> bool:
        """Remove a specific reference."""
        for attr in references_model_map.keys():
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
            self.entity_references = None
            self.user_interactions = None
            self.embeddings = None
            self.code_executions = None
            self.tool_calls = None
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
                    detailed_summary.append(f"[{attr.capitalize()}: {i}/{len(value)}] {str(item)}")
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
        fields_to_compare = references_model_map.keys()
        
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
            
        for field in self.model_fields:
            self_items = getattr(self, field) or []
            other_items = getattr(other, field) or []
            
            # If this field is empty in self, continue
            if not self_items:
                continue
                
            # If self has items but other doesn't, it can't be a subset
            if not other_items:
                return False
                
            # For other fields, compare the actual objects
            self_set = {str(item) for item in self_items}
            other_set = {str(item) for item in other_items}
            if not self_set.issubset(other_set):
                return False
                
        return True
    
class DataCluster(References, BaseDataStructure):
    """DataCluster is a container for various types of references."""
    pass
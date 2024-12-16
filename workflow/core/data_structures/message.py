from __future__ import annotations
from enum import Enum
from typing import Optional, Dict, Any, List, TYPE_CHECKING
from pydantic import Field, field_validator
from workflow.core.data_structures.base_models import Embeddable, ContentType, FileType
from workflow.core.data_structures.central_types import ReferencesType
from workflow.util.message_prune.message_prune_utils import RoleTypes, MessageApiFormat

if TYPE_CHECKING:
    from workflow.core.data_structures.references import References

def get_default_references():
    from workflow.core.data_structures.references import References
    return References()

class MessageGenerators(str, Enum):
    USER = "user"
    LLM = "llm"
    TOOL = "tool"
    SYSTEM = "system"

class MessageDict(Embeddable):
    role: RoleTypes = Field(default=RoleTypes.USER, description="Role of the message")
    content: Optional[str] = Field(default=None, description="Content of the message")
    generated_by: MessageGenerators = Field(default=MessageGenerators.USER, description="The entity that generated the message")
    step: Optional[str] = Field(default="", description="Process that is creating this message, usually the task_name or tool_name")
    assistant_name: Optional[str] = Field(default="", description="Name of the assistant")
    type: ContentType = Field(default=ContentType.TEXT, description="Type of the message")
    references: ReferencesType = Field(default_factory=get_default_references, description="References associated with this message")
    creation_metadata: Optional[Dict[str, Any]] = Field(default=None, description="Metadata about the creation of the message, like cost, tokens, end reason, etc.")

    @field_validator('references')
    def validate_references(cls, v):
        from workflow.core.data_structures import References
        if isinstance(v, References):
            return v
        elif isinstance(v, dict):
            return References(**v)
        else:
            return References()
    
    def __str__(self) -> str:
        content = self.content if self.content else ''
        msg_type = self.type if self.type else ''
        step = self.step if self.step else ''
        
        message_parts = []

        # Base content
        if msg_type in [FileType.IMAGE, FileType.AUDIO, FileType.VIDEO, FileType.FILE]:
            message_parts.append(f"{content}\n\n")
            file_refs = self.references.get_references('files')
            if file_refs:
                message_parts.extend([str(file_ref) for file_ref in file_refs])
        elif msg_type == ContentType.TEXT:
            message_parts.append(f"{content}\n\n")
            if self.references:
                message_parts.append(f"References: {self.references.detailed_summary()}")
        elif msg_type == ContentType.TASK_RESULT:
            generated_by = f" (generated by {self.generated_by})" if self.generated_by in [MessageGenerators.USER, MessageGenerators.LLM] else ""
            message_parts.append(f"Step: {step}{generated_by}:\n{content}\n\n")
            task_responses = self.references.get_references('task_responses')
            if task_responses:
                message_parts.extend([str(task_response) for task_response in task_responses])
        elif msg_type == ContentType.ENTITY_REFERENCE:
            message_parts.append(f"{content}\n\n")
            url_refs = self.references.get_references('entity_references')
            if url_refs:
                message_parts.extend([str(url_ref) for url_ref in url_refs])
        elif msg_type == ContentType.MULTIPLE:
            message_parts.append(f"{content}\n\n")
            message_parts.append(self.references.detailed_summary())
        else:
            message_parts.append(f"{content}\n\n")

        return "\n".join(message_parts)
   
    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        if self.references:
            if isinstance(self.references, dict):
                from workflow.core.data_structures.references import References
                data['references'] = References(**self.references).model_dump(*args, **kwargs)
            else:
                data['references'] = self.references.model_dump(*args, **kwargs)
        return data
   
    def add_reference(self, reference: Any):
        """
        Add a reference to the message. This can be any type supported by the References class.
        """
        self.references.add_reference(reference)

    def get_references_by_type(self, ref_type: str) -> List[Any]:
        """
        Get references by type. This returns references of the specified type.
        """
        return self.references.get_references(ref_type)
    
    def convert_to_api_format(self) -> MessageApiFormat:
        """Convert a MessageDict to the API format."""
        api_message = MessageApiFormat(
            role=self.role,
            content=self.content
        )
        if self.references.tool_calls:
            api_message["tool_calls"] = [tool_call.model_dump() for tool_call in self.references.tool_calls]
        return api_message
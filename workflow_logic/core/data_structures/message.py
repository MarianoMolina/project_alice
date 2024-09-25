from __future__ import annotations
from typing import Optional, Literal, Dict, Any, List, TYPE_CHECKING
from pydantic import Field, ConfigDict, field_validator
from workflow_logic.core.data_structures.base_models import BaseDataStructure, ContentType
from workflow_logic.core.data_structures.central_types import FileReferenceType, TaskResponseType, ToolCallType, ReferenceType

if TYPE_CHECKING:
    from workflow_logic.core.data_structures.file_reference import FileReference
    from workflow_logic.core.data_structures.task_response import TaskResponse
    from workflow_logic.core.data_structures.parameters import ToolCall

class MessageDict(BaseDataStructure):
    role: Literal["user", "assistant", "system", "tool"] = Field(default="user", description="Role of the message")
    content: Optional[str] = Field(default=None, description="Content of the message")
    generated_by: Literal["user", "llm", "tool"] = Field(default="user", description="Who created the message")
    step: Optional[str] = Field(default="", description="Process that is creating this message, usually the task_name or tool_name")
    assistant_name: Optional[str] = Field(default="", description="Name of the assistant")
    type: ContentType = Field(default=ContentType.TEXT, description="Type of the message")
    tool_calls: Optional[List[ToolCallType]] = Field(default=None, description="List of tool calls in the message")
    tool_call_id: Optional[str] = Field(None, description="The id of the tool call that generated this task response")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Context of the message")
    function_call: Optional[Dict[str, Any]] = Field(default=None, description="Function call in the message")
    request_type: Optional[str] = Field(default=None, description="Request type of the message, if any. Can be 'approval', 'confirmation', etc.")
    task_responses: List[TaskResponseType] = Field(default_factory=list, description="List of associated task responses")
    references: List[FileReferenceType] = Field(default_factory=list, description="List of file references in the message")
    creation_metadata: Optional[Dict[str, Any]] = Field(default=None, description="Metadata about the creation of the message, like cost, tokens, end reason, etc.")

    model_config = ConfigDict(arbitrary_types_allowed=True)

    @field_validator('task_responses')
    def validate_task_responses(cls, v):
        from workflow_logic.core.data_structures.task_response import TaskResponse
        return [TaskResponse(**item) if not isinstance(item, TaskResponse) else item for item in v]

    @field_validator('references')
    def validate_references(cls, v):
        from workflow_logic.core.data_structures.file_reference import FileReference, FileContentReference
        
        def cast_reference(item):
            if isinstance(item, (FileReference, FileContentReference)):
                return item
            elif isinstance(item, dict):
                if 'content' in item:
                    return FileContentReference(**item)
                else:
                    return FileReference(**item)
            else:
                raise ValueError(f"Invalid reference type: {type(item)}")
        
        return [cast_reference(item) for item in v]

    @field_validator('tool_calls')
    def validate_tool_calls(cls, v):
        from workflow_logic.core.data_structures.parameters import ToolCall
        if v is not None:
            return [ToolCall(**item) if not isinstance(item, ToolCall) else item for item in v]
        return v
    
    def __str__(self) -> str:
        role = self.role if self.role else ''
        content = self.content if self.content else ''
        msg_type = self.type if self.type else ''
        assistant_name = self.assistant_name if self.assistant_name else ''
        step = self.step if self.step else ''
        if msg_type == "text":
            return f"{role}{f' ({assistant_name})' if assistant_name else ''}: {content}"
        elif msg_type == "tool":
            return f"Tool result: {content}{f' ({step})' if step else ''}"
        return f"{role}: {content}"
   
    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        if self.tool_calls:
            data['tool_calls'] = [tool_call.model_dump(*args, **kwargs) for tool_call in self.tool_calls]
        if self.task_responses:
            data['task_responses'] = [task_response.model_dump(*args, **kwargs) for task_response in self.task_responses]
        if self.references:
            data['references'] = [reference.model_dump(*args, **kwargs) for reference in self.references]
        return data
   
    def add_reference(self, reference: ReferenceType):
        """
        Add a reference to the message. This can be a FileReference, FileContentReference, or TaskResponse.
        """
        from workflow_logic.core.data_structures.file_reference import FileReference
        from workflow_logic.core.data_structures.task_response import TaskResponse

        if isinstance(reference, FileReference):
            self.references.append(reference)
        elif isinstance(reference, TaskResponse):
            self.task_responses.append(reference)
        else:
            raise ValueError(f"Unsupported reference type: {type(reference)}")

    def get_references_by_type(self, ref_type: ContentType) -> List[ReferenceType]:
        """
        Get references by type. This can return FileReferences, FileContentReferences, or TaskResponses.
        If the ref_type is MULTIPLE, all references and task responses are returned.
        """
        if ref_type == ContentType.MULTIPLE:
            return self.references + self.task_responses
        elif ref_type == ContentType.TASK_RESPONSE:
            return self.task_responses
        else:
            return [ref for ref in self.references if ref.type == ref_type]
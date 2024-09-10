from __future__ import annotations
from typing import TypeVar, Annotated, Union, TYPE_CHECKING

if TYPE_CHECKING:
    from .message import MessageDict
    from .file_reference import FileReference, FileContentReference
    from .output_interfaces import OutputInterface, StringOutput, LLMChatOutput, SearchResult, WorkflowOutput, SearchOutput
    from .task_response import TaskResponse, DatabaseTaskResponse
    from .user import User
    from .llm_config import LLMConfig
    from .parameters import ParameterDefinition, FunctionConfig, FunctionParameters, ToolCall, ToolCallConfig, ToolFunction

T = TypeVar('T')

MessageDictType = Annotated[T, "MessageDict"]
FileReferenceType = Annotated[T, "FileReference"]
FileContentReferenceType = Annotated[T, "FileContentReference"]
OutputInterfaceType = Annotated[T, "OutputInterface"]
StringOutputType = Annotated[T, "StringOutput"]
LLMChatOutputType = Annotated[T, "LLMChatOutput"]
SearchResultType = Annotated[T, "SearchResult"]
WorkflowOutputType = Annotated[T, "WorkflowOutput"]
SearchOutputType = Annotated[T, "SearchOutput"]
TaskResponseType = Annotated[T, "TaskResponse"]
DatabaseTaskResponseType = Annotated[T, "DatabaseTaskResponse"]
UserType = Annotated[T, "User"]
LLMConfigType = Annotated[T, "LLMConfig"]
ParameterDefinitionType = Annotated[T, "ParameterDefinition"]
FunctionConfigType = Annotated[T, "FunctionConfig"]
FunctionParametersType = Annotated[T, "FunctionParameters"]
ToolCallType = Annotated[T, "ToolCall"]
ToolCallConfigType = Annotated[T, "ToolCallConfig"]
ToolFunctionType = Annotated[T, "ToolFunction"]

ReferenceType = Union[FileReferenceType, TaskResponseType]
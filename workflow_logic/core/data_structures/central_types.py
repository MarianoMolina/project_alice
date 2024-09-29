from __future__ import annotations
from typing import TypeVar, Annotated, Union, TYPE_CHECKING

if TYPE_CHECKING:
    from .message import MessageDict
    from .file_reference import FileReference, FileContentReference
    # from .output_interfaces import OutputInterface, StringOutput, LLMChatOutput, SearchResult, WorkflowOutput, SearchOutput
    from .task_response import TaskResponse
    from .user import User
    from .model_config import ModelConfig
    from .parameters import ParameterDefinition, FunctionConfig, FunctionParameters, ToolCall, ToolCallConfig, ToolFunction
    from .references import References  

T = TypeVar('T')

MessageDictType = Annotated[T, "MessageDict"]
FileReferenceType = Annotated[T, "FileReference"]
FileContentReferenceType = Annotated[T, "FileContentReference"]
# OutputInterfaceType = Annotated[T, "OutputInterface"]
# StringOutputType = Annotated[T, "StringOutput"]
# LLMChatOutputType = Annotated[T, "LLMChatOutput"]
# SearchResultType = Annotated[T, "SearchResult"]
# WorkflowOutputType = Annotated[T, "WorkflowOutput"]
# SearchOutputType = Annotated[T, "SearchOutput"]
TaskResponseType = Annotated[T, "TaskResponse"]
UserType = Annotated[T, "User"]
ModelConfigType = Annotated[T, "ModelConfig"]
ParameterDefinitionType = Annotated[T, "ParameterDefinition"]
FunctionConfigType = Annotated[T, "FunctionConfig"]
FunctionParametersType = Annotated[T, "FunctionParameters"]
ToolCallType = Annotated[T, "ToolCall"]
ToolCallConfigType = Annotated[T, "ToolCallConfig"]
ToolFunctionType = Annotated[T, "ToolFunction"]
ReferencesType = Annotated[T, "References"]

# ReferenceType = Union[FileReferenceType, TaskResponseType]
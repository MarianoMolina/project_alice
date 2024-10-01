from .message import MessageDict
from .file_reference import FileReference, FileContentReference, generate_file_content_reference, get_file_content
# from .output_interfaces import OutputInterface, StringOutput, LLMChatOutput, WorkflowOutput, SearchOutput, FileOutput
from .url_reference import URLReference
from .task_response import TaskResponse
from .user import User, UserRoles
from .references import References
from .model_config import ModelConfig
from .api_utils import ApiName, ApiType, ModelType, ModelApis
from .parameters import ParameterDefinition, FunctionConfig, FunctionParameters, ToolCall, ToolCallConfig, ToolFunction, ensure_tool_function
from .base_models import EntityType, FileType, ContentType

# Rebuild all models
MessageDict.model_rebuild()
FileReference.model_rebuild()
FileContentReference.model_rebuild()
# OutputInterface.model_rebuild()
# StringOutput.model_rebuild()
# LLMChatOutput.model_rebuild()
# WorkflowOutput.model_rebuild()
# SearchOutput.model_rebuild()
URLReference.model_rebuild()
TaskResponse.model_rebuild()
User.model_rebuild()
ModelConfig.model_rebuild()
ParameterDefinition.model_rebuild()
FunctionConfig.model_rebuild()
FunctionParameters.model_rebuild()
ToolCall.model_rebuild()
ToolCallConfig.model_rebuild()
ToolFunction.model_rebuild()
References.model_rebuild()

__all__ = ['FileReference', 'ContentType', 'FileType', 'FileContentReference', 'generate_file_content_reference', 'get_file_content', 'MessageDict', 'ModelConfig',
           'URLReference', 'TaskResponse', 'User', 'UserRoles',
           'ApiName', 'ApiType', 'ModelType', 'ParameterDefinition', 'FunctionConfig', 'FunctionParameters', 'ToolCall', 'ToolCallConfig',
           'ToolFunction', 'ensure_tool_function', 'EntityType', 'ModelApis', 'FileOutput', 'References']
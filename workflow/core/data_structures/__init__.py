from .message import MessageDict
from .file_reference import FileReference, FileContentReference, generate_file_content_reference, get_file_content
from .url_reference import URLReference
from .task_response import TaskResponse, complete_inner_execution_history
from .node_response import NodeResponse, ExecutionHistoryItem
from .user_interaction import UserInteraction, UserCheckpoint, UserResponse
from .user import User, UserRoles
from .references import References
from .model_config import ModelConfig
from .model import AliceModel
from .prompt import Prompt
from .api_utils import ApiName, ApiType, ModelType, ModelApis
from .parameters import ParameterDefinition, FunctionConfig, FunctionParameters, ToolCall, ToolCallConfig, ToolFunction, ensure_tool_function
from .base_models import EntityType, FileType, ContentType, TasksEndCodeRouting, EmbeddingChunk, Embeddable, BaseDataStructure

# Rebuild all models
MessageDict.model_rebuild()
FileReference.model_rebuild()
FileContentReference.model_rebuild()
URLReference.model_rebuild()
TaskResponse.model_rebuild()
NodeResponse.model_rebuild()
EmbeddingChunk.model_rebuild()
Embeddable.model_rebuild()
ExecutionHistoryItem.model_rebuild()
UserInteraction.model_rebuild()
UserCheckpoint.model_rebuild()
UserResponse.model_rebuild()
User.model_rebuild()
ModelConfig.model_rebuild()
ParameterDefinition.model_rebuild()
FunctionConfig.model_rebuild()
FunctionParameters.model_rebuild()
ToolCall.model_rebuild()
ToolCallConfig.model_rebuild()
ToolFunction.model_rebuild()
References.model_rebuild()
AliceModel.model_rebuild()
Prompt.model_rebuild()

__all__ = ['FileReference', 'ContentType', 'FileType', 'FileContentReference', 'generate_file_content_reference', 'get_file_content', 'MessageDict', 'ModelConfig',
           'URLReference', 'TaskResponse', 'User', 'UserRoles', 'UserInteraction', 'ExecutionHistoryItem', 'NodeResponse', 'TasksEndCodeRouting', 'EmbeddingChunk',
           'ApiName', 'ApiType', 'ModelType', 'ParameterDefinition', 'FunctionConfig', 'FunctionParameters', 'ToolCall', 'ToolCallConfig', 'UserCheckpoint', 'UserResponse',
           'ToolFunction', 'ensure_tool_function', 'EntityType', 'ModelApis', 'FileOutput', 'References', 'complete_inner_execution_history', 'Embeddable',
           'AliceModel', 'Prompt', 'BaseDataStructure']
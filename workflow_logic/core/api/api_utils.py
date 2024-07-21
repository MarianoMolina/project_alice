from pydantic import BaseModel
from typing import Dict, Any, Literal, Union
from workflow_logic.core.tasks.task import  AliceTask
from workflow_logic.core import AliceChat
from workflow_logic.core.api import APIManager
from workflow_logic.core.tasks import APITask, AliceTask, RedditSearchTask, Workflow, WikipediaSearchTask, GoogleSearchTask, ExaSearchTask, ArxivSearchTask, BasicAgentTask, PromptAgentTask, CheckTask, CodeGenerationLLMTask, CodeExecutionLLMTask, AgentWithFunctions

available_task_types: list[AliceTask] = [
    Workflow,
    AgentWithFunctions,
    PromptAgentTask,
    CodeGenerationLLMTask,
    CodeExecutionLLMTask,
    CheckTask,
    BasicAgentTask,
    RedditSearchTask,
    ExaSearchTask,
    WikipediaSearchTask,
    GoogleSearchTask,
    ArxivSearchTask,
    APITask
]

class TaskExecutionRequest(BaseModel):
    taskId: str
    inputs: Dict[str, Any]

# The order of this list is used to determine which entities are created first
EntityType = Literal["users", "models", "parameters", "prompts", "agents", "tasks", "chats", "task_responses", "apis"]
# Utility function for deep API availability check
async def deep_api_check(item: Union[AliceTask, AliceChat], api_manager: APIManager) -> Dict[str, Any]:
    if isinstance(item, AliceTask) or isinstance(item, AliceChat):
        return item.deep_validate_required_apis(api_manager)
    else:
        raise ValueError(f"Unsupported item type for API check: {type(item)}")
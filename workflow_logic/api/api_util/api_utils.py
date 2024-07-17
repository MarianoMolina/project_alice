import logging
from pydantic import BaseModel
from typing import Dict, Any, Literal, Union
from workflow_logic.core.model.model_config import LLMConfig
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

def create_task_from_json(task_dict: dict) -> AliceTask:
    # logging.info(f"Creating task from JSON: {task_dict}")
    # logging.info(f"Available task types: {available_task_types}")
    task_type = task_dict.pop("task_type", "")
    if not task_type:
        raise ValueError("Task type not specified in task definition.")
    for task in available_task_types:
        if task_type == task.__name__:
            logging.info(f"Creating task of type {task_type}")
            return task(**task_dict)
    raise ValueError(f"Task type {task_type} not found in available task types.")

class TaskExecutionRequest(BaseModel):
    taskId: str
    inputs: Dict[str, Any]

# The order of this list is used to determine which entities are created first
EntityType = Literal["users", "models", "parameters", "prompts", "agents", "tasks", "chats", "task_responses", "apis"]
# Utility function for deep API availability check
async def deep_api_check(item: Union[AliceTask, AliceChat], api_manager: APIManager) -> Dict[str, Any]:
    if isinstance(item, AliceTask):
        return item.deep_validate_required_apis(api_manager)
    elif isinstance(item, AliceChat):
        result = {
            "chat_name": item.name,
            "status": "valid",
            "warnings": [],
            "llm_api": "valid",
            "functions": []
        }
        
        # Check LLM API
        try:
            api_manager.retrieve_api_data("LLM_MODEL", item.model_id)
        except ValueError as e:
            result["status"] = "warning"
            result["llm_api"] = "invalid"
            result["warnings"].append(str(e))
        
        # Check functions
        for func in item.functions:
            func_result = func.deep_validate_required_apis(api_manager)
            result["functions"].append(func_result)
            if func_result["status"] == "warning":
                result["status"] = "warning"
                result["warnings"].extend(func_result["warnings"])
        
        return result
    else:
        raise ValueError(f"Unsupported item type for API check: {type(item)}")
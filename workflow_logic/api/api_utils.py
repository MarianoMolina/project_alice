import logging
from pydantic import BaseModel
from typing import Dict, Any, Literal
from workflow_logic.core.model.model_config import LLMConfig
from workflow_logic.core.tasks.task import  AliceTask
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
            return task.model_validate(task_dict)
    raise ValueError(f"Task type {task_type} not found in available task types.")

class TaskExecutionRequest(BaseModel):
    taskId: str
    inputs: Dict[str, Any]

def inject_llm_config_in_task(task: AliceTask, llm_config: LLMConfig):
    if task.agent and not task.agent.llm_config:
        task.agent.llm_config = llm_config
    if task.tasks:
        for subtask in task.tasks.values():
            subtask = inject_llm_config_in_task(subtask, llm_config)
    return task

# The order of this list is used to determine which entities are created first
EntityType = Literal["users", "models", "parameters", "prompts", "agents", "tasks", "chats", "task_responses"]

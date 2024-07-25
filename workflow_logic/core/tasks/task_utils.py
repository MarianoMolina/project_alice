from workflow_logic.core.tasks import APITask, AliceTask, Workflow, BasicAgentTask, PromptAgentTask, CheckTask, CodeGenerationLLMTask, CodeExecutionLLMTask
from pydantic import BaseModel
from typing import Any, Dict

available_task_types: list[AliceTask] = [
    Workflow,
    PromptAgentTask,
    CodeGenerationLLMTask,
    CodeExecutionLLMTask,
    CheckTask,
    BasicAgentTask,
    APITask
]
class TaskExecutionRequest(BaseModel):
    taskId: str
    inputs: Dict[str, Any]
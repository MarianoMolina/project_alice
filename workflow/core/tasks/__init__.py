from workflow.util import LOGGER
from pydantic import ValidationError
from .agent_tasks import PromptAgentTask, CheckTask, CodeExecutionLLMTask, CodeGenerationLLMTask, EmbeddingTask, RetrievalTask, GenerateImageTask, TextToSpeechTask, WebScrapeBeautifulSoupTask
from .api_tasks import APITask
from .task import AliceTask
from .workflow import Workflow
from .task_utils import generate_node_responses_summary, validate_and_process_function_inputs

available_task_types: list[AliceTask] = [
    Workflow,
    PromptAgentTask,
    CodeGenerationLLMTask,
    CodeExecutionLLMTask,
    CheckTask,
    APITask,
    RetrievalTask,
    EmbeddingTask,
    GenerateImageTask,
    TextToSpeechTask,
    WebScrapeBeautifulSoupTask
]

def create_task_from_json(task_dict: dict) -> AliceTask:
    task_type = task_dict.pop("task_type", "")
    if not task_type:
        LOGGER.error(f'Task type not specified in task definition: {task_dict}')
        raise ValueError("Task type not specified in task definition.")

    # Handle nested tasks
    if "tasks" in task_dict:
        nested_tasks = task_dict["tasks"]
        task_dict["tasks"] = {}
        for task_key, task_data in nested_tasks.items():
            if isinstance(task_data, dict):
                # This is a new task definition
                task_dict["tasks"][task_key] = create_task_from_json(task_data)
            else:
                LOGGER.error(f"Invalid task data for key '{task_key}': {task_data}")
                raise ValueError(f"Invalid task data for key '{task_key}': {task_data}")

    for task_class in available_task_types:
        if task_type == task_class.__name__:
            try:                
                task = task_class(**task_dict)
                LOGGER.debug(f"Just created task: {task.model_dump()}")
                return task
            except Exception as e:
                LOGGER.error(f"Error creating task of type {task_type}: {str(e)} \n Task data: {task_dict}")
                raise ValidationError(f"Error creating task of type {task_type}: {str(e)}")
    LOGGER.error(f"Task type {task_type} not found in available task types.")
    raise ValueError(f"Task type {task_type} not found in available task types.")

__all__ = ['AliceTask', 'Workflow', 'PromptAgentTask', 'APITask', 'APISearchTask', 'GenerateImageTask', 'RetrievalTask', 'generate_node_responses_summary', 'validate_and_process_function_inputs',
           'CheckTask', 'CodeExecutionLLMTask', 'CodeGenerationLLMTask', 'EmbeddingTask', 'TextToSpeechTask', 'WebScrapeBeautifulSoupTask', 'create_task_from_json']
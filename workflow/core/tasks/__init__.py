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
__all__ = ['AliceTask', 'Workflow', 'PromptAgentTask', 'APITask', 'APISearchTask', 'GenerateImageTask', 'RetrievalTask',
           'CheckTask', 'CodeExecutionLLMTask', 'CodeGenerationLLMTask', 'EmbeddingTask', 'TextToSpeechTask', 'WebScrapeBeautifulSoupTask']
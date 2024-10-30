from .agent_tasks import BasicAgentTask
from .prompt_agent_tasks import PromptAgentTask, CheckTask, CodeExecutionLLMTask, CodeGenerationLLMTask
from .api_tasks import APITask
from .task import AliceTask
from .workflow import Workflow
from .embedding_tasks import EmbeddingTask, RetrievalTask
from .img_gen_tasks import GenerateImageTask
from .tts_tasks import TextToSpeechTask
from .web_scrapping_tasks import WebScrapeBeautifulSoupTask
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
__all__ = ['AliceTask', 'Workflow', 'BasicAgentTask', 'PromptAgentTask', 'APITask', 'APISearchTask', 'GenerateImageTask', 'RetrievalTask',
           'CheckTask', 'CodeExecutionLLMTask', 'CodeGenerationLLMTask', 'EmbeddingTask', 'TextToSpeechTask', 'WebScrapeBeautifulSoupTask']
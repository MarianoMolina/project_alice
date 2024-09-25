from .agent_tasks import BasicAgentTask, PromptAgentTask, CheckTask, CodeExecutionLLMTask, CodeGenerationLLMTask
from .api_tasks import APITask
from .task import AliceTask
from .workflow import Workflow
from .img_gen_tasks import GenerateImageTask
from .embedding_tasks import EmbeddingTask
from .img_gen_tasks import GenerateImageTask
from .tts_tasks import TextToSpeechTask
from .web_scrapping_tasks import WebScrapeBeautifulSoupTask

__all__ = ['AliceTask', 'Workflow', 'BasicAgentTask', 'PromptAgentTask', 'APITask', 'APISearchTask', 'GenerateImageTask',
           'CheckTask', 'CodeExecutionLLMTask', 'CodeGenerationLLMTask', 'EmbeddingTask', 'TextToSpeechTask', 'WebScrapeBeautifulSoupTask']
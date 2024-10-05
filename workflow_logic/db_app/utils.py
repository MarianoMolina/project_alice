from workflow_logic.core.tasks import APITask, AliceTask, Workflow, PromptAgentTask, CheckTask, CodeGenerationLLMTask, CodeExecutionLLMTask, WebScrapeBeautifulSoupTask, EmbeddingTask, GenerateImageTask, TextToSpeechTask

available_task_types: list[AliceTask] = [
    Workflow,
    PromptAgentTask,
    CodeGenerationLLMTask,
    CodeExecutionLLMTask,
    CheckTask,
    APITask,
    EmbeddingTask,
    GenerateImageTask,
    TextToSpeechTask,
    WebScrapeBeautifulSoupTask
]
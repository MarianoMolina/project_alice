import { Api, Code, Downloading, ForkLeft, Image, LogoDev, RecordVoiceOver, Schema, SimCardDownload, SupportAgent, Tag, Task } from "@mui/icons-material";
import { TaskType } from "../types/TaskTypes";

export const taskTypeIcons: Record<TaskType, React.ReactElement> = {
    [TaskType.APITask]: <Api />,
    [TaskType.CheckTask]: <ForkLeft />,
    [TaskType.CodeExecutionLLMTask]: <Code />,
    [TaskType.CodeGenerationLLMTask]: <LogoDev />,
    [TaskType.EmbeddingTask]: <Tag/>,
    [TaskType.GenerateImageTask]: <Image />,
    [TaskType.PromptAgentTask]: <SupportAgent />,
    [TaskType.RetrievalTask]: <SimCardDownload />,
    [TaskType.TextToSpeechTask]: <RecordVoiceOver />,
    [TaskType.WebScrapeBeautifulSoupTask]: <Downloading />,
    [TaskType.Workflow]: <Schema />,

}
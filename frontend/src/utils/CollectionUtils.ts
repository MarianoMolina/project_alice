
import { 
    Message, Build, Code, Assignment, AttachFile, Description,
    Feedback, PersonOutline, Diversity2, Functions, QuestionAnswer,
    Api, Settings, Category, LiveHelp,
    Chat
  } from "@mui/icons-material";
  import { AIAssistantIcon, APIConfigIcon } from "./CustomIcons";
  import { SvgIconComponent } from "@mui/icons-material";
import { CollectionElementString } from "../types/CollectionTypes";

export const collectionElementIcons: Record<CollectionElementString, SvgIconComponent> = {
    Message: Message,
    ChatThread: QuestionAnswer,
    ToolCall: Build,
    CodeExecution: Code,
    TaskResponse: Assignment,
    File: AttachFile,
    EmbeddingChunk: Description,
    UserInteraction: Feedback,
    EntityReference: PersonOutline,
    DataCluster: Diversity2,
    Agent: AIAssistantIcon as SvgIconComponent,
    Task: Functions,
    Chat: Chat,
    API: Api,
    APIConfig: APIConfigIcon as SvgIconComponent,
    Model: Category,
    Prompt: Description,
    Parameter: Settings,
    UserCheckpoint: LiveHelp,
    User: PersonOutline
  };
import { AliceAgent } from "./AgentTypes";
import { Prompt } from "./PromptTypes";
import { FunctionParameters } from "./ParameterTypes";
import { Api, Code, Downloading, ForkLeft, Image, LogoDev, RecordVoiceOver, Schema, SimCardDownload, SupportAgent, Tag } from "@mui/icons-material";
import { ApiType } from './ApiTypes';
import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from "./CollectionTypes";
import { API } from './ApiTypes';
import { UserCheckpoint } from "./UserCheckpointTypes";
import { convertToPopulatedDataCluster, PopulatedDataCluster } from "./DataClusterTypes";

export enum TaskType {
  APITask = "APITask",
  PromptAgentTask = "PromptAgentTask",
  CheckTask = "CheckTask",
  CodeGenerationLLMTask = "CodeGenerationLLMTask",
  CodeExecutionLLMTask = "CodeExecutionLLMTask",
  Workflow = "Workflow",
  EmbeddingTask = "EmbeddingTask",
  RetrievalTask = "RetrievalTask",
  GenerateImageTask = "GenerateImageTask",
  TextToSpeechTask = "TextToSpeechTask",
  WebScrapeBeautifulSoupTask = "WebScrapeBeautifulSoupTask"
}
export type RouteMapTuple = [string | null, boolean];
export type RouteMap = { [key: number]: RouteMapTuple };
export type TasksEndCodeRouting = { [key: string]: RouteMap };

export interface AliceTask extends BaseDatabaseObject {
  task_name: string;
  task_description: string;
  task_type: TaskType;
  agent?: AliceAgent | null;
  input_variables: FunctionParameters | null;
  exit_codes: { [key: string]: string };
  templates: { [key: string]: Prompt | null };
  tasks: { [key: string]: string };
  exit_code_response_map: { [key: string]: number } | null;
  start_node?: string | null;
  required_apis?: ApiType[] | null;
  node_end_code_routing?: TasksEndCodeRouting | null;
  user_checkpoints?: { [key: string]: UserCheckpoint };
  data_cluster?: string;
  recursive: boolean;
  max_attempts?: number;
}

export interface PopulatedTask extends Omit<AliceTask, 'data_cluster' | 'tasks'> {
  data_cluster?: PopulatedDataCluster;
  tasks: { [key: string]: PopulatedTask };
}

export const convertToAliceTask = (data: any): AliceTask => {
  return {
    ...convertToBaseDatabaseObject(data),
    task_name: data?.task_name || '',
    task_description: data?.task_description || '',
    task_type: data?.task_type || '',
    input_variables: data?.input_variables || null,
    exit_codes: data?.exit_codes || {},
    recursive: data?.recursive || false,
    templates: data?.templates || {},
    tasks: typeof data?.tasks === 'object' && data?.tasks !== null ? data.tasks : {},
    exit_code_response_map: data?.exit_code_response_map || null,
    start_node: data?.start_node || null,
    required_apis: data?.required_apis || null,
    node_end_code_routing: data?.node_end_code_routing || null,
    max_attempts: data?.max_attempts || undefined,
    agent: data?.agent || null,
    user_checkpoints: data?.user_checkpoints || {},
    data_cluster: data?.data_cluster || undefined,
  };
};

export const convertToPopulatedTask = (data: any): PopulatedTask => {
  return {
    ...convertToBaseDatabaseObject(data),
    task_name: data?.task_name || '',
    task_description: data?.task_description || '',
    task_type: data?.task_type || '',
    input_variables: data?.input_variables || null,
    exit_codes: data?.exit_codes || {},
    recursive: data?.recursive || false,
    templates: data?.templates || {},
    tasks: typeof data?.tasks === 'object' && data?.tasks !== null ? data.tasks : {},
    exit_code_response_map: data?.exit_code_response_map || null,
    start_node: data?.start_node || null,
    required_apis: data?.required_apis || null,
    node_end_code_routing: data?.node_end_code_routing || null,
    max_attempts: data?.max_attempts || undefined,
    agent: data?.agent || null,
    user_checkpoints: data?.user_checkpoints || {},
    data_cluster: data?.data_cluster ? convertToPopulatedDataCluster(data.data_cluster) : undefined,
  };
}

export const DefaultAliceTask: AliceTask = convertToAliceTask({});

export interface TaskComponentProps extends EnhancedComponentProps<AliceTask | PopulatedTask> {
  onExecute?: () => Promise<any>;
}

export interface TaskFormsProps extends TaskComponentProps {
  handleAccordionToggle: (accordion: string | null) => void;
  activeAccordion: string | null;
  apis: API[];
}
export const getDefaultTaskForm = (taskType: TaskType): PopulatedTask => {
  return taskDescriptions[taskType].default_form;
};

export interface TaskTypeDetails {
  description: string;
  icon: React.ReactElement;
  detail_knowledgebase_link?: string;
  default_form: PopulatedTask;
}

const defaultRouting: TasksEndCodeRouting = {
  'default': {
    0: [null, false],
    1: ['default', true],
  }
};

const agentNodeRoutes: TasksEndCodeRouting = {
  'llm_generation': {
    0: ['tool_call_execution', false],
    1: ['llm_generation', true],
  },
  'tool_call_execution': {
    0: ['code_execution', false],
    1: ['tool_call_execution', true],
  },
  'code_execution': {
    0: [null, false],
    1: ['code_execution', true],
  },
};

const codeNodeRoutes: TasksEndCodeRouting = {
  'llm_generation': {
    0: ['code_execution', false],
    1: ['llm_generation', true],
  },
  'code_execution': agentNodeRoutes.code_execution,
};

const codeExecutionRoutes: TasksEndCodeRouting = {
  'code_execution': agentNodeRoutes.code_execution,
};

const checkTaskRoutes: TasksEndCodeRouting = {
  'llm_generation': {
    0: [null, false],
    1: ['llm_generation', true],
  },
};
const genImageRoutes: TasksEndCodeRouting = {
  'generate_image': {
    0: [null, false],
    1: ['generate_image', true],
  },
};
const embeddingTaskRoutes: TasksEndCodeRouting = {
  'generate_embedding': {
    0: [null, false],
    1: ['generate_embedding', true],
  },
};
const textToSpeechTaskRoutes: TasksEndCodeRouting = {
  'text_to_speech': {
    0: [null, false],
    1: ['text_to_speech', true],
  },
};

const scrapeNodeRoutes: TasksEndCodeRouting = {
  'fetch_url': {
    0: ['generate_selectors_and_parse', false],
    1: ['fetch_url', true],
  },
  'generate_selectors_and_parse': {
    0: ['url_summarization', false],
    1: ['generate_selectors_and', true],
  },
  'url_summarization': {
    0: [null, false],
    1: ['url_summarization', true],
  }
};

const retrievalTaskNodes: TasksEndCodeRouting = {
  'ensure_embeddings_in_data_cluster': {
    0: ['retrieve_relevant_embeddings', false],
    1: ['ensure_embeddings_in_data_cluster', true],
  },
  'retrieve_relevant_embeddings': {
    0: [null, false],
    1: ['retrieve_relevant_embeddings', true],
  }
}

const baseForm: Partial<PopulatedTask> = {
  task_name: '',
  task_description: '',
  agent: null,
  input_variables: null,
  templates: {},
  tasks: {},
  required_apis: [],
  exit_codes: { 0: "Success", 1: "Failure" },
  recursive: false,
  exit_code_response_map: null,
  start_node: null,
  node_end_code_routing: null,
  max_attempts: 1
};

export const taskDescriptions: Record<TaskType, TaskTypeDetails> = {
  [TaskType.APITask]: {
    description: `A specialized task type designed to interact with external APIs in a standardized way. It handles a single API interaction with built-in validation, error handling, and retry logic. Each APITask:
- Works with exactly one API type
- Automatically validates API configurations and requirements
- Handles API authentication and connection management
- Provides consistent error handling and retry behavior
- Can be configured with custom input parameters
- Reports detailed execution status and results

Best used for: Direct API interactions like sending any single-purpose API operation.`,
    icon: <Api />,
    detail_knowledgebase_link: '/shared/knowledgebase/core/task/api_task.md',
    default_form: {
      ...baseForm as PopulatedTask,
      node_end_code_routing: defaultRouting,
      start_node: Object.keys(defaultRouting)[0],
      task_type: TaskType.APITask,
    }
  },
  [TaskType.Workflow]: {
    description: `A container task type that orchestrates multiple subtasks in a defined sequence. It manages task dependencies, data flow, and execution order while providing centralized control and monitoring. Each Workflow:
- Coordinates multiple tasks in a specific order
- Automatically handles data passing between tasks
- Manages task dependencies and execution flow
- Provides unified error handling across all subtasks
- Supports checkpoints for user interactions
- Collects and aggregates results from all subtasks

Best used for: Complex operations requiring multiple steps, processes involving different APIs or services, or any sequence of tasks that need to be executed in a coordinated manner.`,
    icon: <Schema />,
    detail_knowledgebase_link: '/shared/knowledgebase/core/task/workflow.md',
    default_form: {
      ...baseForm as PopulatedTask,
      node_end_code_routing: {},
      start_node: null,
      recursive: true,
      task_type: TaskType.Workflow,
    }
  },
  [TaskType.PromptAgentTask]: {
    description: `A versatile task type that processes prompts using AI agents, with built-in support for tool usage and code execution. Each PromptAgentTask:
- Processes natural language prompts through AI agents
- Can execute function calls (tools) based on AI responses
- Optionally handles code generation and execution
- Maintains conversation history for context
- Supports custom prompt templates
- Automatically manages the flow between AI responses, tool usage, and code execution

Best used for: Complex interactions requiring AI assistance, tasks that combine natural language processing with specific actions, or operations needing flexible tool integration.
`,
    icon: <SupportAgent />,
    detail_knowledgebase_link: '/shared/knowledgebase/core/task/prompt_agent_task.md',
    default_form: {
      ...baseForm as PopulatedTask,
      node_end_code_routing: agentNodeRoutes,
      start_node: Object.keys(agentNodeRoutes)[0],
      task_type: TaskType.PromptAgentTask,
    }
  },
  [TaskType.CheckTask]: {
    description: `A specialized evaluation task that analyzes AI responses against specific criteria or keywords. Each CheckTask:
- Validates AI outputs against predefined success criteria
- Uses configurable response mapping for pass/fail conditions
- Provides binary (approved/failed) decisions
- Supports retry logic for failed checks
- Can be used as a validation step in workflows

Best used for: Quality control, content validation, safety checks, or any scenario requiring specific criteria verification before proceeding.
`,
    icon: <ForkLeft />,
    detail_knowledgebase_link: '/shared/knowledgebase/core/task/check_task.md',
    default_form: {
      ...baseForm as PopulatedTask,
      node_end_code_routing: checkTaskRoutes,
      start_node: Object.keys(checkTaskRoutes)[0],
      task_type: TaskType.CheckTask,
    }
  },
  [TaskType.CodeGenerationLLMTask]: {
    description: `A dedicated task type for AI - powered code generation and execution. Each CodeGenerationLLMTask:
- Generates code based on natural language descriptions
- Automatically executes and validates generated code
- Provides intelligent retry logic for failed attempts
- Handles code improvement based on execution results
- Maintains context between generation attempts
- Supports multiple programming languages

Best used for: Automated code generation, code prototyping, script creation, coding assistance, or any task requiring code generation and execution from natural language descriptions.`,
    icon: <LogoDev />,
    detail_knowledgebase_link: '/shared/knowledgebase/core/task/code_gen_task.md',
    default_form: {
      ...baseForm as PopulatedTask,
      node_end_code_routing: codeNodeRoutes,
      start_node: Object.keys(codeNodeRoutes)[0],
      task_type: TaskType.CodeGenerationLLMTask,
    }
  },
  [TaskType.GenerateImageTask]: {
    description: `A task type that creates images from text descriptions using AI. Each GenerateImageTask:
- Creates images based on text prompts
- Supports multiple image generation in one request
- Offers customizable image sizes
- Provides quality control options
- Handles complex descriptive prompts
- Includes automatic retry for failed generations

Best used for: Creating custom illustrations, generating visual content for presentations, prototyping design ideas, or any scenario requiring AI-generated images from textual descriptions.`,
    icon: <Image />,
    detail_knowledgebase_link: '/shared/knowledgebase/core/task/generate_image_task.md',
    default_form: { 
      ...baseForm as PopulatedTask,
      node_end_code_routing: genImageRoutes,
      start_node: Object.keys(genImageRoutes)[0],
      task_type: TaskType.GenerateImageTask,
    }
  },
  [TaskType.EmbeddingTask]: {
    description: `A task type that converts text into numerical vector representations (embeddings). Each EmbeddingTask:
- Transforms text into high-dimensional vectors
- Preserves semantic meaning of text
- Handles single or multiple text inputs
- Generates consistent embeddings for similar content
- Supports different text formats
- Includes error handling for malformed inputs

Best used for: Semantic search implementations, text similarity analysis, content recommendation systems, or any application requiring text-to-vector conversion for machine learning purposes.
`,
    icon: <Tag />,
    detail_knowledgebase_link: '/shared/knowledgebase/core/task/embedding_task.md',
    default_form: {
      ...baseForm as PopulatedTask,
      node_end_code_routing: embeddingTaskRoutes,
      start_node: Object.keys(embeddingTaskRoutes)[0],
      task_type: TaskType.EmbeddingTask,
    }
  },
  [TaskType.WebScrapeBeautifulSoupTask]: {
    description: `A task type designed for intelligent web content extraction and processing. Each WebScrapeBeautifulSoupTask:
- Fetches and processes web page content
- Intelligently identifies relevant content sections
- Automatically generates optimal CSS selectors for content extraction
- Removes unwanted elements (ads, navigation, etc.)
- Handles various webpage structures
- Falls back to reliable parsing strategies when needed
- Preserves content structure and hierarchy
- Includes metadata about extraction process

Best used for: Content aggregation, data collection from websites, web research automation, content monitoring systems, or any scenario requiring structured extraction of web content while filtering out non-essential elements.`,
    icon: <Downloading />,
    detail_knowledgebase_link: '/shared/knowledgebase/core/task/web_scrape_task.md',
    default_form: {
      ...baseForm as PopulatedTask,
      node_end_code_routing: scrapeNodeRoutes,
      start_node: Object.keys(scrapeNodeRoutes)[0],
      task_type: TaskType.WebScrapeBeautifulSoupTask,
    }
  },
  [TaskType.RetrievalTask]: {
    description: `A specialized task type that handles semantic search and content retrieval using embeddings. Each RetrievalTask:
- Converts content into searchable vector embeddings
- Performs semantic similarity searches across multiple content types
- Automatically manages embedding generation and updates
- Supports multiple file formats and content types
- Provides configurable similarity thresholds
- Returns ranked results based on relevance
- Handles incremental updates to content collections

Best used for: Building semantic search systems, implementing content recommendation engines, finding similar documents, creating knowledge bases with semantic search capabilities, or any scenario requiring content retrieval based on meaning rather than exact matching.
`,
    icon: <SimCardDownload />,
    detail_knowledgebase_link: '/shared/knowledgebase/core/task/retrieval_task.md',
    default_form: {
      ...baseForm as PopulatedTask,
      node_end_code_routing: retrievalTaskNodes,
      start_node: Object.keys(retrievalTaskNodes)[0],
      task_type: TaskType.RetrievalTask,
    }
  },
  [TaskType.TextToSpeechTask]: {
    description: `A specialized task type that converts text into natural-sounding speech. Each TextToSpeechTask:
- Transforms written text into spoken audio
- Supports multiple voice options
- Allows speed adjustment of speech
- Handles long-form text conversion
- Produces audio files as output
- Includes automatic retry logic for failed conversions

Best used for: Creating voiceovers, generating spoken content for accessibility, audio content creation, or any scenario requiring text-to-speech conversion.
`,
    icon: <RecordVoiceOver />,
    detail_knowledgebase_link: '/shared/knowledgebase/core/task/text_to_speech_task.md',
    default_form: {
      ...baseForm as PopulatedTask,
      node_end_code_routing: textToSpeechTaskRoutes,
      start_node: Object.keys(textToSpeechTaskRoutes)[0],
      task_type: TaskType.TextToSpeechTask,
    }
  },
  [TaskType.CodeExecutionLLMTask]: {
    description: ``,
    icon: <Code />,
    detail_knowledgebase_link: '/shared/knowledgebase/core/task/code_exec_task.md',
    default_form: {
      ...baseForm as PopulatedTask,
      node_end_code_routing: codeExecutionRoutes,
      start_node: Object.keys(codeExecutionRoutes)[0],
      task_type: TaskType.CodeExecutionLLMTask,
    }
  },
};
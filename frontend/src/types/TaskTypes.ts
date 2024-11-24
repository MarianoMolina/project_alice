import { AliceAgent } from "./AgentTypes";
import { Prompt } from "./PromptTypes";
import { FunctionParameters } from "./ParameterTypes";
import { ApiType } from './ApiTypes';
import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from "./CollectionTypes";
import { API } from './ApiTypes';
import Logger from "../utils/Logger";
import { UserCheckpoint } from "./UserCheckpointTypes";
import { References } from "./ReferenceTypes";
import { convertToDataCluster } from "./DataClusterTypes";

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
  tasks: { [key: string]: AliceTask };
  valid_languages: string[];
  exit_code_response_map: { [key: string]: number } | null;
  start_node?: string | null;
  required_apis?: ApiType[] | null;
  node_end_code_routing?: TasksEndCodeRouting | null;
  user_checkpoints?: { [key: string]: UserCheckpoint };
  data_cluster?: References;
  recursive: boolean;
  max_attempts?: number;
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
    tasks: typeof data?.tasks === 'object' && data?.tasks !== null
      ? Object.fromEntries(Object.entries(data.tasks).map(([key, value]: [string, any]) => [key, value || value]))
      : {},
    valid_languages: data?.valid_languages || [],
    exit_code_response_map: data?.exit_code_response_map || null,
    start_node: data?.start_node || null,
    required_apis: data?.required_apis || null,
    node_end_code_routing: data?.node_end_code_routing || null,
    max_attempts: data?.max_attempts || undefined,
    agent: data?.agent || null,
    user_checkpoints: data?.user_checkpoints || {},
    data_cluster: data?.data_cluster ? convertToDataCluster(data.data_cluster) : undefined,
  };
};

export const DefaultAliceTask: AliceTask = convertToAliceTask({});

export interface TaskComponentProps extends EnhancedComponentProps<AliceTask> {
  onExecute?: () => Promise<any>;
}

export interface TaskFormsProps extends TaskComponentProps {
  handleAccordionToggle: (accordion: string | null) => void;
  activeAccordion: string | null;
  apis: API[];
}

export const getDefaultTaskForm = (taskType: TaskType): AliceTask => {
  const baseForm: AliceTask = {
    task_name: '',
    task_description: '',
    task_type: taskType,
    agent: null,
    input_variables: null,
    templates: {},
    tasks: {},
    required_apis: [],
    exit_codes: { 0: "Success", 1: "Failure" },
    recursive: false,
    valid_languages: [],
    exit_code_response_map: null,
    start_node: null,
    node_end_code_routing: null,
    max_attempts: 1
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
      0: ['code_execution', true],
      1: [null, true],
    },
  };

  const scrapeNodeRoutes: TasksEndCodeRouting = {
    'fetch_url': {
      0: ['generate_selectors_and_parse', false],
      1: ['fetch_url', true],
    },
    'generate_selectors_and_parse': {
      0: ['None', false],
      1: ['generate_selectors_and', true],
    }
  };

  Logger.debug('getDefaultTaskForm', taskType);
  switch (taskType) {
    case 'PromptAgentTask':
      return { ...baseForm, node_end_code_routing: agentNodeRoutes };
    case 'WebScrapeBeautifulSoupTask':
      return { ...baseForm, node_end_code_routing: scrapeNodeRoutes };
    case 'CheckTask':
      return { ...baseForm, exit_code_response_map: {}, node_end_code_routing: agentNodeRoutes };
    case 'CodeExecutionLLMTask':
      return { ...baseForm, valid_languages: ['python', 'javascript'] };
    case 'CodeGenerationLLMTask':
      return { ...baseForm, node_end_code_routing: agentNodeRoutes };
    case 'Workflow':
      return { ...baseForm, recursive: true };
    case 'APITask':
    default:
      return baseForm;
  }
};

export const taskDescriptions: Record<TaskType, string> = {
  [TaskType.APITask]: `A specialized task type designed to interact with external APIs in a standardized way. It handles a single API interaction with built-in validation, error handling, and retry logic. Each APITask:
- Works with exactly one API type
- Automatically validates API configurations and requirements
- Handles API authentication and connection management
- Provides consistent error handling and retry behavior
- Can be configured with custom input parameters
- Reports detailed execution status and results

Best used for: Direct API interactions like sending any single-purpose API operation.`,
  [TaskType.Workflow]: `A container task type that orchestrates multiple subtasks in a defined sequence. It manages task dependencies, data flow, and execution order while providing centralized control and monitoring. Each Workflow:
- Coordinates multiple tasks in a specific order
- Automatically handles data passing between tasks
- Manages task dependencies and execution flow
- Provides unified error handling across all subtasks
- Supports checkpoints for user interactions
- Collects and aggregates results from all subtasks

Best used for: Complex operations requiring multiple steps, processes involving different APIs or services, or any sequence of tasks that need to be executed in a coordinated manner.`,
  [TaskType.PromptAgentTask]: `A versatile task type that processes prompts using AI agents, with built-in support for tool usage and code execution. Each PromptAgentTask:
- Processes natural language prompts through AI agents
- Can execute function calls (tools) based on AI responses
- Optionally handles code generation and execution
- Maintains conversation history for context
- Supports custom prompt templates
- Automatically manages the flow between AI responses, tool usage, and code execution

Best used for: Complex interactions requiring AI assistance, tasks that combine natural language processing with specific actions, or operations needing flexible tool integration.
`,
  [TaskType.CheckTask]: `A specialized evaluation task that analyzes AI responses against specific criteria or keywords. Each CheckTask:
- Validates AI outputs against predefined success criteria
- Uses configurable response mapping for pass/fail conditions
- Provides binary (approved/failed) decisions
- Supports retry logic for failed checks
- Can be used as a validation step in workflows

Best used for: Quality control, content validation, safety checks, or any scenario requiring specific criteria verification before proceeding.
`,
  [TaskType.CodeGenerationLLMTask]: `A dedicated task type for AI - powered code generation and execution. Each CodeGenerationLLMTask:
- Generates code based on natural language descriptions
- Automatically executes and validates generated code
- Provides intelligent retry logic for failed attempts
- Handles code improvement based on execution results
- Maintains context between generation attempts
- Supports multiple programming languages

Best used for: Automated code generation, code prototyping, script creation, coding assistance, or any task requiring code generation and execution from natural language descriptions.`,
  [TaskType.GenerateImageTask]: `A task type that creates images from text descriptions using AI. Each GenerateImageTask:
- Creates images based on text prompts
- Supports multiple image generation in one request
- Offers customizable image sizes
- Provides quality control options
- Handles complex descriptive prompts
- Includes automatic retry for failed generations

Best used for: Creating custom illustrations, generating visual content for presentations, prototyping design ideas, or any scenario requiring AI-generated images from textual descriptions.`,
  [TaskType.EmbeddingTask]: `A task type that converts text into numerical vector representations (embeddings). Each EmbeddingTask:
- Transforms text into high-dimensional vectors
- Preserves semantic meaning of text
- Handles single or multiple text inputs
- Generates consistent embeddings for similar content
- Supports different text formats
- Includes error handling for malformed inputs

Best used for: Semantic search implementations, text similarity analysis, content recommendation systems, or any application requiring text-to-vector conversion for machine learning purposes.
`,
  [TaskType.WebScrapeBeautifulSoupTask]: `A task type designed for intelligent web content extraction and processing. Each WebScrapeBeautifulSoupTask:
- Fetches and processes web page content
- Intelligently identifies relevant content sections
- Automatically generates optimal CSS selectors for content extraction
- Removes unwanted elements (ads, navigation, etc.)
- Handles various webpage structures
- Falls back to reliable parsing strategies when needed
- Preserves content structure and hierarchy
- Includes metadata about extraction process

Best used for: Content aggregation, data collection from websites, web research automation, content monitoring systems, or any scenario requiring structured extraction of web content while filtering out non-essential elements.`,
  [TaskType.RetrievalTask]: `A specialized task type that handles semantic search and content retrieval using embeddings. Each RetrievalTask:
- Converts content into searchable vector embeddings
- Performs semantic similarity searches across multiple content types
- Automatically manages embedding generation and updates
- Supports multiple file formats and content types
- Provides configurable similarity thresholds
- Returns ranked results based on relevance
- Handles incremental updates to content collections

Best used for: Building semantic search systems, implementing content recommendation engines, finding similar documents, creating knowledge bases with semantic search capabilities, or any scenario requiring content retrieval based on meaning rather than exact matching.
`,
  [TaskType.TextToSpeechTask]: `A specialized task type that converts text into natural-sounding speech. Each TextToSpeechTask:
- Transforms written text into spoken audio
- Supports multiple voice options
- Allows speed adjustment of speech
- Handles long-form text conversion
- Produces audio files as output
- Includes automatic retry logic for failed conversions

Best used for: Creating voiceovers, generating spoken content for accessibility, audio content creation, or any scenario requiring text-to-speech conversion.
`,
  [TaskType.CodeExecutionLLMTask]: ``,

};
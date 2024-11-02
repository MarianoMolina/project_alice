import { AliceAgent } from "./AgentTypes";
import { Prompt } from "./PromptTypes";
import { FunctionParameters } from "./ParameterTypes";
import { ApiType } from './ApiTypes';
import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from "./CollectionTypes";
import { API } from './ApiTypes';
import Logger from "../utils/Logger";
import { UserCheckpoint } from "./UserCheckpointTypes";
import { References } from "./ReferenceTypes";

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
    data_cluster: data?.data_cluster || {},
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

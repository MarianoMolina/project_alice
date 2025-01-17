import { AliceAgent } from "./AgentTypes";
import { Prompt } from "./PromptTypes";
import { FunctionParameters } from "./ParameterTypes";
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

export interface TaskComponentProps extends EnhancedComponentProps<AliceTask | PopulatedTask> {
  onExecute?: () => Promise<any>;
}

export interface TaskFormsProps extends TaskComponentProps {
  handleAccordionToggle: (accordion: string | null) => void;
  activeAccordion: string | null;
  apis: API[];
}

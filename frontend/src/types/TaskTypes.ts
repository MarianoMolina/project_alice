import { AliceAgent } from "./AgentTypes";
import { Prompt } from "./PromptTypes";
import { FunctionParameters } from "./ParameterTypes";
import { ApiType } from './ApiTypes';
import { EnhancedComponentProps } from "./CollectionTypes";
import { API, APIEngine } from './ApiTypes';
import { BaseDataseObject } from "./UserTypes";
import Logger from "../utils/Logger";

export enum TaskType {
  APITask = "APITask",
  PromptAgentTask = "PromptAgentTask",
  CheckTask = "CheckTask",
  CodeGenerationLLMTask = "CodeGenerationLLMTask",
  CodeExecutionLLMTask = "CodeExecutionLLMTask",
  Workflow = "Workflow",
  EmbeddingTask = "EmbeddingTask",
  GenerateImageTask = "GenerateImageTask",
  TextToSpeechTask = "TextToSpeechTask",
  WebScrapeBeautifulSoupTask = "WebScrapeBeautifulSoupTask"
}
export type RouteMapTuple = [string | null, boolean];
export type RouteMap = { [key: number]: RouteMapTuple };
export type TasksEndCodeRouting = { [key: string]: RouteMap };

export interface AliceTask extends BaseDataseObject {
  _id?: string;
  task_name: string;
  task_description: string;
  task_type: TaskType;
  input_variables: FunctionParameters | null;
  exit_codes: { [key: string]: string };
  recursive: boolean;
  templates: { [key: string]: Prompt | null };
  tasks: { [key: string]: AliceTask };
  valid_languages: string[];
  timeout: number | null;
  prompts_to_add: { [key: string]: Prompt } | null;
  exit_code_response_map: { [key: string]: number } | null;
  start_task?: string | null;
  required_apis?: ApiType[] | null;
  task_selection_method?: CallableFunction | null;
  tasks_end_code_routing?: TasksEndCodeRouting | null;
  max_attempts?: number;
  agent?: AliceAgent | null;
  human_input?: boolean;
  api_engine?: APIEngine | null;
}

export const convertToAliceTask = (data: any): AliceTask => {
  return {
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
    timeout: data?.timeout || null,
    prompts_to_add: data?.prompts_to_add || null,
    exit_code_response_map: data?.exit_code_response_map || null,
    start_task: data?.start_task || null,
    required_apis: data?.required_apis || null,
    task_selection_method: data?.task_selection_method || null,
    tasks_end_code_routing: data?.tasks_end_code_routing || null,
    max_attempts: data?.max_attempts || undefined,
    agent: data?.agent || null,
    human_input: data?.human_input || false,
    api_engine: data?.api_engine || null,
    created_by: data?.created_by || '',
    updated_by: data?.updated_by || '',
    createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
    updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
    _id: data?._id || undefined,
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
    human_input: false,
    input_variables: null,
    templates: {},
    prompts_to_add: null,
    tasks: {},
    required_apis: [],
    exit_codes: {0: "Success", 1: "Failure"},
    recursive: false,
    valid_languages: [],
    timeout: null,
    exit_code_response_map: null,
    start_task: null,
    task_selection_method: null,
    tasks_end_code_routing: null,
    max_attempts: 3
  };

  Logger.debug('getDefaultTaskForm', taskType);
  switch (taskType) {
    case 'CheckTask':
      return { ...baseForm, exit_code_response_map: {} };
    case 'CodeExecutionLLMTask':
      return { ...baseForm, valid_languages: ['python', 'javascript'], timeout: 30000 };
    case 'CodeGenerationLLMTask':
      return { ...baseForm };
    case 'Workflow':
      return { ...baseForm, recursive: true };
    case 'APITask':
      return {
        ...baseForm,
        task_name: '',
        task_description: '',
        input_variables: null,
        required_apis: [],
      };
    default:
      return baseForm;
  }
};

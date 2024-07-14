import { AliceAgent } from './AgentTypes';
import { Prompt } from "./PromptTypes";
import { FunctionParameters } from "./ParameterTypes";

export type TaskType = "CVGenerationTask" | "RedditSearchTask" | "APITask" | "WikipediaSearchTask" | "GoogleSearchTask" | "ExaSearchTask" | "ArxivSearchTask" | "BasicAgentTask" | "PromptAgentTask" | "CheckTask" | "CodeGenerationLLMTask" | "CodeExecutionLLMTask" | "AgentWithFunctions" | "Workflow";

export interface AliceTask {
  task_name: string;
  task_description: string;
  task_type: TaskType;
  input_variables: FunctionParameters | null;
  exit_codes: { [key: string]: string };
  recursive: boolean;
  templates: { [key: string]: Prompt };
  tasks: { [key: string]: AliceTask };
  valid_languages: string[];
  timeout: number | null;
  prompts_to_add: { [key: string]: Prompt } | null;
  exit_code_response_map: { [key: string]: number } | null;
  start_task?: string | null;
  task_selection_method?: CallableFunction | null;
  tasks_end_code_routing?: { [key: string]: { [key: number]: any } } | null;
  max_attempts?: number;
  agent?: AliceAgent | null;
  execution_agent?: AliceAgent | null;
  human_input?: boolean;
  created_by?: string;
  updated_by?: string;
  createdAt?: Date;
  updatedAt?: Date;
  _id?: string;
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
    task_selection_method: data?.task_selection_method || null,
    tasks_end_code_routing: data?.tasks_end_code_routing || null,
    max_attempts: data?.max_attempts || undefined,
    agent: data?.agent || null,
    execution_agent: data?.execution_agent || null,
    human_input: data?.human_input || false,
    created_by: data?.created_by || '',
    updated_by: data?.updated_by || '',
    createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
    updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
    _id: data?._id || undefined,
  };
};

export const DefaultAliceTask: AliceTask = convertToAliceTask({});

// Base interface for all task forms
export interface BaseTaskForm {
  task_name: string;
  task_description: string;
  task_type: TaskType;
  agent: AliceAgent | null;
  human_input: boolean;
  input_variables: FunctionParameters | null;
  templates: { [key: string]: Prompt };
  prompts_to_add: { [key: string]: Prompt } | null;
}

export interface PromptAgentTaskForm extends BaseTaskForm { }

export interface AgentWithFunctionsForm extends BaseTaskForm {
  tasks: { [key: string]: AliceTask };
  execution_agent: AliceAgent | null;
}

export interface CheckTaskForm extends BaseTaskForm {
  exit_code_response_map: { [key: string]: number } | null;
}

export interface CodeExecutionLLMTaskForm extends BaseTaskForm {
  exit_codes: { [key: string]: string };
  valid_languages: string[];
  timeout: number | null;
}

export interface CodeGenerationLLMTaskForm extends BaseTaskForm {
  exit_codes: { [key: string]: string };
}

export interface WorkflowForm extends BaseTaskForm {
  tasks: { [key: string]: AliceTask };
  start_task: string | null;
  max_attempts: number;
  recursive: boolean;
}

export type AnyTaskForm = PromptAgentTaskForm | AgentWithFunctionsForm | CheckTaskForm | CodeExecutionLLMTaskForm | CodeGenerationLLMTaskForm | WorkflowForm;

export type TaskFormProps<T extends AnyTaskForm> = {
  form: T;
  setForm: (newForm: T) => void;
  agents: AliceAgent[];
  prompts: Prompt[];
  availableTasks: AliceTask[];
  viewOnly: boolean;
};

export interface TaskComponentProps {
  items: AliceTask[] | null;
  item: AliceTask | null;
  mode: 'create' | 'view' | 'edit';
  onChange: (newItem: Partial<AliceTask>) => void;
  handleSave: () => Promise<void>;
  onInteraction?: (task: AliceTask) => void;
  onView?: (task: AliceTask) => void;
  isInteractable?: boolean;
  showHeaders?: boolean;
}
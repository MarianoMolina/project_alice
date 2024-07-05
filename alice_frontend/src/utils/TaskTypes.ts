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
  templates: { [key: string]: string };
  tasks: { [key: string]: string };
  agent_name: string | null;
  valid_languages: string[];
  timeout: number | null;
  prompts_to_add: { [key: string]: string } | null;
  exit_code_response_map: { [key: string]: number } | null;
  start_task?: string | null;
  task_selection_method?: CallableFunction | null;
  tasks_end_code_routing?: { [key: string]: { [key: number]: any } } | null;
  max_attempts?: number;
  agent_id?: AliceAgent | null;
  execution_agent_id?: AliceAgent | null;
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
      ? Object.fromEntries(Object.entries(data.tasks).map(([key, value]: [string, any]) => [key, value._id || value]))
      : {},
    agent_name: data?.agent_name || null,
    valid_languages: data?.valid_languages || [],
    timeout: data?.timeout || null,
    prompts_to_add: data?.prompts_to_add || null,
    exit_code_response_map: data?.exit_code_response_map || null,
    start_task: data?.start_task || null,
    task_selection_method: data?.task_selection_method || null,
    tasks_end_code_routing: data?.tasks_end_code_routing || null,
    max_attempts: data?.max_attempts || undefined,
    agent_id: data?.agent_id || null,
    execution_agent_id: data?.execution_agent_id || null,
    human_input: data?.human_input || false,
    created_by: data?.created_by || '',
    updated_by: data?.updated_by || '',
    createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
    updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
    _id: data?._id || undefined,
  };
};

export const DefaultAliceTask: AliceTask = convertToAliceTask({});

export interface PromptAgentTaskForm {
  task_name: string;
  task_description: string;
  task_type: TaskType;
  agent_id: string | null;
  human_input: boolean;
  input_variables: FunctionParameters | null;
  templates: { [key: string]: string };
  prompts_to_add: Map<string, string> | null;
}

export interface AgentWithFunctionsForm extends PromptAgentTaskForm {
  tasks: { [key: string]: string };
  execution_agent_id: string | null;
}

export interface CheckTaskForm extends PromptAgentTaskForm {
  exit_code_response_map: Map<string, number> | null;
}

export interface CodeExecutionLLMTaskForm extends PromptAgentTaskForm {
  exit_codes: { [key: string]: string };
  valid_languages: string[];
  timeout: number | null;
}

export interface CodeGenerationLLMTaskForm extends PromptAgentTaskForm {
  exit_codes: { [key: string]: string };
}

export interface WorkflowForm extends PromptAgentTaskForm {
  tasks: { [key: string]: string };
  start_task: string | null;
  max_attempts: number;
  recursive: boolean;
}

export interface CommonFormProps {
  agents: AliceAgent[];
  prompts: Prompt[];
  availableTasks: AliceTask[];
  viewOnly: boolean;
}

export type TaskFormProps<T> = CommonFormProps & {
  form: Partial<T>;
  setForm: (newForm: Partial<T>) => void;
};

export interface TaskComponentProps {
  items: AliceTask[] | null;
  item: AliceTask | null;
  onChange: (newItem: Partial<AliceTask>) => void;
  mode: 'create' | 'view' | 'edit';
  handleSave: () => Promise<void>;
  isInteractable?: boolean;
  onInteraction?: (task: AliceTask) => void;
  onAddTask?: (task: AliceTask) => void;
  showHeaders?: boolean;
}

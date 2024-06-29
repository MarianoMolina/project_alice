export type RoleType = 'user' | 'assistant' | 'system';

export interface ChatProps {
  messages: MessageType[];
}

export interface MessageProps {
  message: MessageType
}

export interface TaskResultProps {
  taskResponse: TaskResponse;
}

export interface AliceModel {
  _id: string;
  short_name: string;
  model_name: string;
  model_format: string;
  ctx_size: number;
  model_type: 'instruct' | 'chat' | 'vision';
  deployment: 'local' | 'remote';
  model_file?: string;
  api_key: string;
  port?: number;
  api_type: 'openai' | 'azure' | 'anthropic';
  base_url: string;
  autogen_model_client_cls?: string;
  created_by?: string;
  updated_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageType {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  created_by: 'user' | 'llm' | 'tool';
  step?: string;
  assistant_name?: string;
  context?: Record<string, any>;
  type?: 'text' | 'image' | 'video' | 'audio' | 'file';
  request_type?: string | null;  // Allow null for request_type
  timestamp?: string;
  _id?: string;
}

export interface TaskResponse {
  task_name: string;
  task_description: string;
  status: 'pending' | 'complete' | 'failed';
  result_code: number;
  task_outputs?: Record<string, any>;
  result_diagnostic?: string;
  usage_metrics?: Record<string, any>;
  execution_history?: Record<string, any>[];
  created_by?: string;
  updated_by?: string;
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
}
export interface AliceAgent {
  name: string;
  system_message: string;
  functions: FunctionParameters[];
  functions_map: Map<string, string>;
  agents_in_group: any[];
  autogen_class: "ConversableAgent" | "AssistantAgent" | "UserProxyAgent" | "GroupChatManager" | "LLaVAAgent";
  code_execution_config: boolean;
  max_consecutive_auto_reply: number;
  human_input_mode: "ALWAYS" | "TERMINATE" | "NEVER";
  speaker_selection: Map<string, string>;
  default_auto_reply: string | null;
  llm_config: Map<string, string>;
  created_by?: string;
  updated_by?: string;
  _id: string;
}

export interface ParameterDefinition {
  type: string;
  description: string;
  default?: any;
}

export interface FunctionParameters {
  type: "object";
  properties: Map<string, ParameterDefinition>;
  required: string[];
}

export interface ModelConfig {
  model: string;
  api_key?: string;
  base_url?: string;
  api_type?: string;
  model_client_cls?: string;
}

export interface LLMConfig {
  config_list: ModelConfig[];
  temperature?: number;
  timeout?: number;
}

export interface AliceChat {
  _id: string;
  name: string;
  messages: MessageType[];
  alice_agent: AliceAgent;
  functions?: AliceTask[];
  executor: AliceAgent;
  llm_config?: LLMConfig;
  task_responses: TaskResponse[];
  created_by?: string;
  updated_by?: string;
  createdAt?: string; // ISO 8601 format, e.g., "2022-02-26T17:08:13.930Z"
  updatedAt?: string; // ISO 8601 format, e.g., "2022-02-26T17:08:13.930Z"
}

export interface CreateAliceChat {
  name: string;
  alice_agent: string;
  executor: string;
  llm_config?: LLMConfig;
  functions?: string[];
}

export interface AliceTask {
  task_name: string;
  task_description: string;
  task_type: "CVGenerationTask" | "RedditSearchTask" | "APITask" | "WikipediaSearchTask" | "GoogleSearchTask" | "ExaSearchTask" | "ArxivSearchTask" | "BasicAgentTask" | "PromptAgentTask" | "CheckTask" | "CodeGenerationLLMTask" | "CodeExecutionLLMTask" | "AgentWithFunctions";
  input_variables: FunctionParameters | null;
  exit_codes: Map<string, string>;
  recursive: boolean;
  templates: Map<string, string>;
  tasks: Map<string, string>[];
  agent_name: string | null;
  valid_languages: string[];
  timeout: number | null;
  prompts_to_add: Map<string, string> | null;
  exit_code_response_map: Map<string, number> | null;
  start_task?: string | null;
  task_selection_method?: CallableFunction | null;
  tasks_end_code_routing?: Map<string, Map<number, any>> | null;
  max_attempts?: number;
  agent_id?: AliceAgent | string | null;
  execution_agent_id?: AliceAgent | string | null;
  human_input?: boolean;
  created_by?: string;
  updated_by?: string;
  createdAt?: string; // ISO 8601 format, e.g., "2022-02-26T17:08:13.930Z"
  updatedAt?: string; // ISO 8601 format, e.g., "2022-02-26T17:08:13.930Z"
  _id?: string;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  password?: string; // Optional if you don't need the password on the client-side
  role?: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Prompt {
  _id?: string;
  name: string;
  content: string;
  created_by?: string | User; // Assuming the created_by and updated_by fields are populated with User objects
  updated_by?: string | User; // If they are only IDs, you can just use `string`
  is_templated?: boolean;
  parameters?: Record<string, any>;
  partial_variables?: Record<string, any>;
  version?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
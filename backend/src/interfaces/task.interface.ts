import { Document, Types, Model } from 'mongoose';

export enum TaskType {
  CVGenerationTask = "CVGenerationTask",
  RedditSearchTask = "RedditSearchTask",
  APITask = "APITask",
  WikipediaSearchTask = "WikipediaSearchTask",
  GoogleSearchTask = "GoogleSearchTask",
  ExaSearchTask = "ExaSearchTask",
  ArxivSearchTask = "ArxivSearchTask",
  Workflow = "Workflow",
  BasicAgentTask = "BasicAgentTask",
  PromptAgentTask = "PromptAgentTask",
  CheckTask = "CheckTask",
  CodeGenerationLLMTask = "CodeGenerationLLMTask",
  CodeExecutionLLMTask = "CodeExecutionLLMTask",
}

export interface ITask {
  task_name: string;
  task_description: string;
  task_type: TaskType;
  input_variables: any | null;
  exit_codes: Map<string, string>;
  recursive: boolean;
  templates: Map<string, Types.ObjectId> | null;
  required_apis: Array<string> | null;
  tasks: Map<string, Types.ObjectId> | null;
  valid_languages: string[];
  timeout: number | null;
  prompts_to_add: Map<string, Types.ObjectId> | null;
  exit_code_response_map: Map<string, number> | null;
  start_task: string | null;
  task_selection_method: any | null;
  tasks_end_code_routing: Map<string, Map<string, any>> | null;
  model_id: Types.ObjectId | null;
  max_attempts: number;
  agent: Types.ObjectId | null;
  execution_agent: Types.ObjectId | null;
  human_input: boolean;
  created_by: Types.ObjectId;
  updated_by: Types.ObjectId;
}


export interface ITaskMethods {
  apiRepresentation(): any;
}

export interface ITaskDocument extends ITask, Document, ITaskMethods {
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskModel extends Model<ITaskDocument> {
  // Add any static methods here if needed
}
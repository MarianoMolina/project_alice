import { Document, Types, Model } from 'mongoose';
import { IFunctionParameters, IAPIEngine } from '../utils/schemas';
import { IUserCheckpoint } from './userCheckpoint.interface';

export enum TaskType {
  APITask = "APITask",
  Workflow = "Workflow",
  PromptAgentTask = "PromptAgentTask",
  CheckTask = "CheckTask",
  CodeGenerationLLMTask = "CodeGenerationLLMTask",
  CodeExecutionLLMTask = "CodeExecutionLLMTask",
  EmbeddingTask = "EmbeddingTask",
  RetrievalTask = "RetrievalTask",
  GenerateImageTask = "GenerateImageTask",
  TextToSpeechTask = "TextToSpeechTask",
  WebScrapeBeautifulSoupTask = "WebScrapeBeautifulSoupTask"
}

export interface ITask {
  task_name: string;
  task_description: string;
  task_type: TaskType;
  input_variables: IFunctionParameters | null;
  exit_codes: Map<string, string>;
  recursive: boolean;
  templates: Map<string, Types.ObjectId> | null;
  required_apis: Array<string> | null;
  tasks: Map<string, Types.ObjectId> | null;
  valid_languages: string[];
  timeout: number | null;
  prompts_to_add: Map<string, Types.ObjectId> | null;
  exit_code_response_map: Map<string, number> | null;
  task_selection_method: any | null;
  node_end_code_routing: Map<string, Map<string, any>> | null;
  max_attempts: number;
  agent: Types.ObjectId | null;
  api_engine: IAPIEngine | null;
  start_node: string | null;
  user_checkpoints: Map<string, IUserCheckpoint | Types.ObjectId> | null;
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
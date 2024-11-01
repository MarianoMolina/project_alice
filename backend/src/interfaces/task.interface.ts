import { Document, Types, Model } from 'mongoose';
import { IFunctionParameters } from '../utils/functionSchema';
import { IUserCheckpoint } from './userCheckpoint.interface';
import { References } from './references.interface';

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
  agent: Types.ObjectId | null;
  tasks: Map<string, Types.ObjectId> | null;
  templates: Map<string, Types.ObjectId> | null;
  user_checkpoints: Map<string, IUserCheckpoint | Types.ObjectId> | null;
  data_cluster?: References;
  required_apis: Array<string> | null;
  max_attempts: number;
  recursive: boolean;
  start_node: string | null;
  node_end_code_routing: Map<string, Map<string, any>> | null;
  exit_codes: Map<string, string>;
  exit_code_response_map: Map<string, number> | null;
  valid_languages: string[];
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
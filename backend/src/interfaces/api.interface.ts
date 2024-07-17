import { Types, Model, Document } from 'mongoose';

export enum ApiType {
  LLM_MODEL = 'llm_api',
  GOOGLE_SEARCH = 'google_search',
  REDDIT_SEARCH = 'reddit_search',
  WIKIPEDIA_SEARCH = 'wikipedia_search',
  EXA_SEARCH = 'exa_search',
  ARXIV_SEARCH = 'arxiv_search',
}

export enum ApiName {
  OPENAI = 'openai',
  AZURE = 'azure',
  ANTHROPIC = 'anthropic',
  CUSTOM = 'Custom',
  GOOGLE_SEARCH = 'google_search',
  REDDIT_SEARCH = 'reddit_search',
  WIKIPEDIA_SEARCH = 'wikipedia_search',
  EXA_SEARCH = 'exa_search',
  ARXIV_SEARCH = 'arxiv_search',
}

export interface IAPI {
  api_type: ApiType;
  name: string; // e.g., "OpenAI", "Anthropic", "Google"
  api_name: ApiName; // e.g., "openai", "anthropic", "google_search"
  is_active: boolean;
  health_status: 'healthy' | 'unhealthy' | 'unknown';
  default_model?: Types.ObjectId; // Reference to the default model for LLM APIs
  api_config?: Map<string, any>;
  created_by?: Types.ObjectId;
  updated_by?: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

export interface IAPIMethods {
  apiRepresentation(): any;
}

export interface IAPIDocument extends IAPI, Document, IAPIMethods {
  createdAt: Date;
  updatedAt: Date;
}

export interface IAPIModel extends Model<IAPIDocument> {
  // Add any static methods here if needed
}
import { Types } from 'mongoose';

export enum ApiType {
  LLM_MODEL = 'llm_api',
  GOOGLE_SEARCH = 'google_search',
  REDDIT_SEARCH = 'reddit_search',
  WIKIPEDIA_SEARCH = 'wikipedia_search',
  EXA_SEARCH = 'exa_search',
  ARXIV_SEARCH = 'arxiv_search',
}

export interface IAPI {
  api_type: ApiType;
  name: string; // e.g., "OpenAI", "Anthropic", "Google"
  is_active: boolean;
  health_status: 'healthy' | 'unhealthy' | 'unknown';
  default_model?: Types.ObjectId; // Reference to the default model for LLM APIs
  api_config?: Map<string, any>;
  created_by?: Types.ObjectId;
  updated_by?: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}
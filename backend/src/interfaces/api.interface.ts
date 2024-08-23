import { Types, Model, Document } from 'mongoose';

export enum ApiType {
  LLM_MODEL = 'llm_api',
  GOOGLE_SEARCH = 'google_search',
  REDDIT_SEARCH = 'reddit_search',
  WIKIPEDIA_SEARCH = 'wikipedia_search',
  EXA_SEARCH = 'exa_search',
  ARXIV_SEARCH = 'arxiv_search',
  IMG_VISION = 'img_vision',
  IMG_GENERATION = 'img_generation',
  WEB_SCRAPE = 'web_scrape',
  SPEECH_TO_TEXT = 'speech_to_text',
  TEXT_TO_SPEECH = 'text_to_speech',
  EMBEDDINGS = 'embeddings',
}

export enum ApiName {
  OPENAI = 'openai',
  AZURE = 'azure',
  ANTHROPIC = 'anthropic',
  LM_STUDIO = 'lm-studio',
  CUSTOM = 'Custom',
  GOOGLE_SEARCH = 'google_search',
  REDDIT_SEARCH = 'reddit_search',
  WIKIPEDIA_SEARCH = 'wikipedia_search',
  EXA_SEARCH = 'exa_search',
  ARXIV_SEARCH = 'arxiv_search',
  BEAUTIFULSOUP = 'beautiful-soup'
}

export interface IAPI {
  api_type: ApiType;
  name: string;
  api_name: ApiName; 
  is_active: boolean;
  health_status: 'healthy' | 'unhealthy' | 'unknown';
  default_model?: Types.ObjectId; 
  api_config?: Map<string, any>;
  created_by?: Types.ObjectId;
  updated_by?: Types.ObjectId;
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
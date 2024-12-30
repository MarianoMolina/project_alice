import { Types, Model, Document } from 'mongoose';
import { IUserDocument } from './user.interface';
import { IAPIConfigDocument } from './apiConfig.interface';

export enum ApiType {
  LLM_MODEL = 'llm_api',
  GOOGLE_SEARCH = 'google_search',
  REDDIT_SEARCH = 'reddit_search',
  WIKIPEDIA_SEARCH = 'wikipedia_search',
  EXA_SEARCH = 'exa_search',
  ARXIV_SEARCH = 'arxiv_search',
  GOOGLE_KNOWLEDGE_GRAPH = 'google_knowledge_graph',
  WOLFRAM_ALPHA = 'wolfram_alpha',
  IMG_VISION = 'img_vision',
  IMG_GENERATION = 'img_generation',
  SPEECH_TO_TEXT = 'speech_to_text',
  TEXT_TO_SPEECH = 'text_to_speech',
  EMBEDDINGS = 'embeddings',
  REQUESTS = 'requests',
}

export enum ApiName {
  OPENAI = 'openai',
  AZURE = 'azure',
  GEMINI = 'gemini',
  MISTRAL = 'mistral',
  COHERE = 'cohere',
  GROQ = 'groq',
  DEEPSEEK = 'deepseek',
  LLAMA = 'llama',
  ANTHROPIC = 'anthropic',
  
  GOOGLE_SEARCH = 'google_search',
  REDDIT_SEARCH = 'reddit',
  WIKIPEDIA_SEARCH = 'wikipedia',
  EXA_SEARCH = 'exa',
  ARXIV_SEARCH = 'arxiv',
  GOOGLE_KNOWLEDGE_GRAPH = 'google_knowledge_graph',
  WOLFRAM_ALPHA = 'wolfram_alpha',
  
  PIXART_IMG_GEN = 'pixart',
  LM_STUDIO = 'lm_studio',
  CUSTOM = 'Custom',
  BARK = 'bark',
}

export interface IAPI {
  api_type: ApiType;
  name: string;
  api_name: ApiName;
  is_active: boolean;
  default_model?: Types.ObjectId;
  api_config?: Types.ObjectId | IAPIConfigDocument;
  created_by: Types.ObjectId | IUserDocument;
  updated_by: Types.ObjectId | IUserDocument;
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
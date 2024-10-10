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
  SPEECH_TO_TEXT = 'speech_to_text',
  TEXT_TO_SPEECH = 'text_to_speech',
  EMBEDDINGS = 'embeddings',
}

export enum ApiName {
  OPENAI = 'openai_llm',
  OPENAI_VISION = 'openai_vision',
  OPENAI_IMG_GENERATION = 'openai_img_gen',
  OPENAI_EMBEDDINGS = 'openai_embeddings',
  OPENAI_TTS = 'openai_tts',
  OPENAI_STT = 'openai_stt',
  OPENAI_ASTT = 'openai_adv_stt',
  AZURE = 'azure',
  GEMINI = 'gemini_llm',
  GEMINI_VISION = 'gemini_vision',
  MISTRAL = 'mistral_llm',
  MISTRAL_VISION = 'mistral_vision',
  MISTRAL_EMBEDDINGS = 'mistral_embeddings',
  GEMINI_STT = 'gemini_stt',
  GEMINI_EMBEDDINGS = 'gemini_embeddings',
  GEMINI_IMG_GEN = 'gemini_img_gen',
  COHERE = 'cohere_llm',
  GROQ = 'groq_llm',
  GROQ_VISION = 'groq_vision',
  GROQ_TTS = 'groq_tts',
  META = 'meta_llm',
  META_VISION = 'meta_vision',
  ANTHROPIC = 'anthropic_llm',
  ANTHROPIC_VISION = 'anthropic_vision',
  LM_STUDIO = 'lm-studio_llm',
  LM_STUDIO_VISION = 'lm-studio_vision',
  CUSTOM = 'Custom',
  GOOGLE_SEARCH = 'google_search',
  REDDIT_SEARCH = 'reddit_search',
  WIKIPEDIA_SEARCH = 'wikipedia_search',
  EXA_SEARCH = 'exa_search',
  ARXIV_SEARCH = 'arxiv_search',
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
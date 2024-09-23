import { ApiType, API, LlmProvider } from "../types/ApiTypes";
import { BACKEND_HOST, BACKEND_PORT } from "./Constants";

export interface ApiTypeConfig {
  api_name: string;
  apiConfig: Record<string, string>;
  baseUrl?: string;
}

export const API_TYPE_CONFIGS: Record<ApiType, ApiTypeConfig> = {
  [ApiType.LLM_MODEL]: {
    api_name: 'llm_api',
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.REDDIT_SEARCH]: {
    api_name: 'reddit_search',
    apiConfig: {
      client_id: '',
      secret: '',
    },
  },
  [ApiType.WIKIPEDIA_SEARCH]: {
    api_name: 'wikipedia_search',
    apiConfig: {},
  },
  [ApiType.GOOGLE_SEARCH]: {
    api_name: 'google_search',
    apiConfig: {
      cse_id: '',
      api_key: '',
    },
  },
  [ApiType.EXA_SEARCH]: {
    api_name: 'exa_search',
    apiConfig: {
      api_key: '',
    },
  },
  [ApiType.ARXIV_SEARCH]: {
    api_name: 'arxiv_search',
    apiConfig: {},
  },
  [ApiType.IMG_VISION]: {
    api_name: 'img_vision',
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.IMG_GENERATION]: {
    api_name: 'img_generation',
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.WEB_SCRAPE]: {
    api_name: 'web_scrape',
    apiConfig: {},
  },
  [ApiType.SPEECH_TO_TEXT]: {
    api_name: 'speech_to_text',
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.TEXT_TO_SPEECH]: {
    api_name: 'text_to_speech',
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.EMBEDDINGS]: {
    api_name: 'embeddings',
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
};

export const LLM_PROVIDERS = {
  OpenAI: {
    api_name: LlmProvider.OPENAI,
    baseUrl: 'https://api.openai.com/v1',
  },
  OpenAIAzure: {
    api_name: LlmProvider.AZURE,
    baseUrl: 'https://YOUR_RESOURCE_NAME.openai.azure.com',
  },
  Anthropic: {
    api_name: LlmProvider.ANTHROPIC,
    baseUrl: 'https://api.anthropic.com',
  },
  LMStudio: {
    api_name: LlmProvider.LM_STUDIO,
    baseUrl: `http://${BACKEND_HOST}:${BACKEND_PORT}/chat/completions`,
  },
};
export const modelApis = [ApiType.LLM_MODEL, ApiType.IMG_VISION, ApiType.IMG_GENERATION, ApiType.SPEECH_TO_TEXT, ApiType.TEXT_TO_SPEECH, ApiType.EMBEDDINGS];
export const isModelApi = (apiType: ApiType): boolean => modelApis.includes(apiType);

export const getAvailableApiTypes = (existingApis: API[]): ApiType[] => {
  const existingTypes = new Set(existingApis.map(api => api.api_type));
  return Object.values(ApiType).filter(type => 
    type === ApiType.LLM_MODEL || !existingTypes.has(type)
  );
};
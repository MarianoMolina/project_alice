import { ApiType, API, ApiName } from "../types/ApiTypes";

export interface ApiTypeConfig {
  api_name: Array<ApiName>;
  apiConfig: Record<string, string>;
  baseUrl?: string;
}

export const API_TYPE_CONFIGS: Record<ApiType, ApiTypeConfig> = {
  [ApiType.LLM_MODEL]: {
    api_name: [ApiName.OPENAI, ApiName.AZURE, ApiName.ANTHROPIC, ApiName.LM_STUDIO],
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.REDDIT_SEARCH]: {
    api_name: [ApiName.REDDIT_SEARCH],
    apiConfig: {
      client_id: '',
      secret: '',
    },
  },
  [ApiType.WIKIPEDIA_SEARCH]: {
    api_name: [ApiName.WIKIPEDIA_SEARCH],
    apiConfig: {},
  },
  [ApiType.GOOGLE_SEARCH]: {
    api_name: [ApiName.GOOGLE_SEARCH],
    apiConfig: {
      cse_id: '',
      api_key: '',
    },
  },
  [ApiType.EXA_SEARCH]: {
    api_name: [ApiName.EXA_SEARCH],
    apiConfig: {
      api_key: '',
    },
  },
  [ApiType.ARXIV_SEARCH]: {
    api_name: [ApiName.ARXIV_SEARCH],
    apiConfig: {},
  },
  [ApiType.IMG_VISION]: {
    api_name: [ApiName.OPENAI_VISION, ApiName.ANTHROPIC_VISION, ApiName.LM_STUDIO_VISION],
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.IMG_GENERATION]: {
    api_name: [ApiName.OPENAI_VISION, ApiName.LM_STUDIO_VISION],
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.SPEECH_TO_TEXT]: {
    api_name: [ApiName.OPENAI_STT, ApiName.OPENAI_ASTT],
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.TEXT_TO_SPEECH]: {
    api_name: [ApiName.OPENAI_TTS],
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.EMBEDDINGS]: {
    api_name: [ApiName.OPENAI_EMBEDDINGS],
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
};

export const LLM_PROVIDERS = {
  OpenAI: {
    api_name: [ApiName.OPENAI, ApiName.OPENAI_STT, ApiName.OPENAI_TTS, ApiName.OPENAI_EMBEDDINGS, ApiName.OPENAI_VISION, ApiName.OPENAI_IMG_GENERATION, ApiName.OPENAI_ASTT],
    baseUrl: 'https://api.openai.com/v1',
  },
  OpenAIAzure: {
    api_name: [ApiName.AZURE],
    baseUrl: 'https://YOUR_RESOURCE_NAME.openai.azure.com',
  },
  Anthropic: {
    api_name: [ApiName.ANTHROPIC, ApiName.ANTHROPIC_VISION],
    baseUrl: 'https://api.anthropic.com',
  },
  LMStudio: {
    api_name: [ApiName.LM_STUDIO, ApiName.LM_STUDIO_VISION],
    baseUrl: 'http://localhost:1234/v1',
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
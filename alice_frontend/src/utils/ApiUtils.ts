import { ApiType, API } from "./ApiTypes";

export interface ApiTypeConfig {
  name: string;
  apiConfig: Record<string, string>;
  baseUrl?: string;
}

export const API_TYPE_CONFIGS: Record<ApiType, ApiTypeConfig> = {
  [ApiType.LLM_API]: {
    name: 'LLM API',
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.REDDIT_SEARCH]: {
    name: 'Reddit Search',
    apiConfig: {
      client_id: '',
      secret: '',
    },
  },
  [ApiType.WIKIPEDIA_SEARCH]: {
    name: 'Wikipedia Search',
    apiConfig: {},
  },
  [ApiType.GOOGLE_SEARCH]: {
    name: 'Google Search',
    apiConfig: {
      cse_id: '',
      api_key: '',
    },
  },
  [ApiType.EXA_SEARCH]: {
    name: 'Exa Search',
    apiConfig: {
      api_key: '',
    },
  },
  [ApiType.ARXIV_SEARCH]: {
    name: 'Arxiv Search',
    apiConfig: {},
  },
};

export const LLM_PROVIDERS = {
  OpenAI: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
  },
  OpenAIAzure: {
    name: 'OpenAI Azure',
    baseUrl: 'https://YOUR_RESOURCE_NAME.openai.azure.com',
  },
  Anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
  },
  Custom: {
    name: 'Custom',
    baseUrl: '',
  },
};

export const isLlmApi = (apiType: ApiType): boolean => apiType === ApiType.LLM_API;

export const getAvailableApiTypes = (existingApis: API[]): ApiType[] => {
  const existingTypes = new Set(existingApis.map(api => api.api_type));
  return Object.values(ApiType).filter(type => 
    type === ApiType.LLM_API || !existingTypes.has(type)
  );
};
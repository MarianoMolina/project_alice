import { ApiType, API, ApiName } from "../types/ApiTypes";

export interface ApiTypeConfig {
  api_name: Array<ApiName>;
  apiConfig: Record<string, string>;
  baseUrl?: string;
}

export const API_TYPE_CONFIGS: Record<ApiType, ApiTypeConfig> = {
  [ApiType.LLM_MODEL]: {
    api_name: [ApiName.OPENAI, ApiName.AZURE, ApiName.ANTHROPIC, ApiName.LM_STUDIO, ApiName.GEMINI, ApiName.MISTRAL, ApiName.LLAMA, ApiName.COHERE, ApiName.GROQ],
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.REDDIT_SEARCH]: {
    api_name: [ApiName.REDDIT_SEARCH],
    apiConfig: {
      client_id: '',
      client_secret: '',
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
  [ApiType.GOOGLE_KNOWLEDGE_GRAPH]: {
    api_name: [ApiName.GOOGLE_KNOWLEDGE_GRAPH],
    apiConfig: {
      api_key: '',
    },
  },
  [ApiType.WOLFRAM_ALPHA]: {
    api_name: [ApiName.WOLFRAM_ALPHA],
    apiConfig: {
      app_id: '',
    },
  },
  [ApiType.IMG_VISION]: {
    api_name: [ApiName.OPENAI_VISION, ApiName.ANTHROPIC_VISION, ApiName.LM_STUDIO_VISION, ApiName.GEMINI_VISION, ApiName.MISTRAL_VISION, ApiName.LLAMA_VISION, ApiName.GROQ_VISION],
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.IMG_GENERATION]: {
    api_name: [ApiName.OPENAI_VISION, ApiName.GEMINI_IMG_GEN, ApiName.PIXART_IMG_GEN],
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.SPEECH_TO_TEXT]: {
    api_name: [ApiName.OPENAI_STT, ApiName.OPENAI_ASTT, ApiName.GEMINI_STT],
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.TEXT_TO_SPEECH]: {
    api_name: [ApiName.OPENAI_TTS, ApiName.GROQ_TTS, ApiName.BARK_TTS],
    apiConfig: {
      api_key: '',
      base_url: '',
    },
  },
  [ApiType.EMBEDDINGS]: {
    api_name: [ApiName.OPENAI_EMBEDDINGS, ApiName.MISTRAL_EMBEDDINGS, ApiName.GEMINI_EMBEDDINGS, ApiName.LM_STUDIO_EMBEDDINGS],
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
    api_name: [ApiName.LM_STUDIO, ApiName.LM_STUDIO_VISION, ApiName.LM_STUDIO_EMBEDDINGS],
    baseUrl: 'http://localhost:1234/v1',
  },
  Gemini: {
    api_name: [ApiName.GEMINI, ApiName.GEMINI_VISION, ApiName.GEMINI_EMBEDDINGS, ApiName.GEMINI_STT, ApiName.GEMINI_IMG_GEN],
    baseUrl: 'https://api.gemini.ai',
  },
  Mistral: {
    api_name: [ApiName.MISTRAL, ApiName.MISTRAL_VISION, ApiName.MISTRAL_EMBEDDINGS],
    baseUrl: 'https://api.mistral.ai',
  },
  Llama: {
    api_name: [ApiName.LLAMA, ApiName.LLAMA_VISION],
    baseUrl: 'https://api.llama-api.com',
  },
  Cohere: {
    api_name: [ApiName.COHERE],
    baseUrl: 'https://api.cohere.ai',
  },
  Groq: {
    api_name: [ApiName.GROQ, ApiName.GROQ_VISION, ApiName.GROQ_TTS],
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  Local: {
    api_name: [ApiName.CUSTOM, ApiName.BARK_TTS],
    baseUrl: 'http://localhost:1234/v1',
  }
};

export const modelApis = [ApiType.LLM_MODEL, ApiType.IMG_VISION, ApiType.IMG_GENERATION, ApiType.SPEECH_TO_TEXT, ApiType.TEXT_TO_SPEECH, ApiType.EMBEDDINGS];
export const isModelApi = (apiType: ApiType): boolean => modelApis.includes(apiType);

export const getAvailableApiTypes = (existingApis: API[]): ApiType[] => {
  const existingTypes = new Set(existingApis.map(api => api.api_type));
  return Object.values(ApiType).filter(type => 
    type === ApiType.LLM_MODEL || !existingTypes.has(type)
  );
};
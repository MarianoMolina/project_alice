import { ApiName } from '../../../../types/ApiTypes';
import { API_BASE_URLS, ApiConfigType } from '../../../../utils/ApiUtils';

export const initializeApiConfigMap = (): ApiConfigType => {
  const configMap: Partial<ApiConfigType> = {};
  
  Object.values(ApiName).forEach(apiName => {
    switch(apiName) {
      case ApiName.OPENAI:
      case ApiName.ANTHROPIC:
      case ApiName.GEMINI:
      case ApiName.MISTRAL:
      case ApiName.COHERE:
      case ApiName.LLAMA:
      case ApiName.AZURE:
      case ApiName.GROQ:
      case ApiName.DEEPSEEK:
      case ApiName.CUSTOM:
        configMap[apiName] = {
          api_key: '',
          base_url: API_BASE_URLS[apiName] || ''
        };
        break;
      
      case ApiName.GOOGLE_SEARCH:
        configMap[apiName] = {
          api_key: '',
          cse_id: ''
        };
        break;
        
      case ApiName.REDDIT:
        configMap[apiName] = {
          client_id: '',
          client_secret: ''
        };
        break;
        
      case ApiName.WOLFRAM_ALPHA:
        configMap[apiName] = {
          app_id: ''
        };
        break;
        
      case ApiName.EXA:
      case ApiName.GOOGLE_KNOWLEDGE_GRAPH:
        configMap[apiName] = {
          api_key: ''
        };
        break;
        
      case ApiName.LM_STUDIO:
      case ApiName.BARK:
      case ApiName.PIXART:
        configMap[apiName] = {
          base_url: API_BASE_URLS[apiName] || ''
        };
        break;
        
      case ApiName.WIKIPEDIA:
      case ApiName.ARXIV:
        configMap[apiName] = {};
        break;
    }
  });

  return configMap as ApiConfigType;
};

export interface UserApiUpdatePayload {
  userId: string;
  enabledApis: ApiName[];
}

export const compareApiConfigs = (
  current: ApiConfigType,
  original: ApiConfigType
): boolean => {
  return JSON.stringify(current) === JSON.stringify(original);
};
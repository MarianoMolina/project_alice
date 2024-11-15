import { AliceModel, convertToAliceModel } from "./ModelTypes";
import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from "./CollectionTypes";
import { APIConfig, convertToAPIConfig, getDefaultAPIConfigForm } from "./ApiConfigTypes";

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
    LLAMA = 'llama',
    ANTHROPIC = 'anthropic',
    BARK = 'bark',
    PIXART = 'pixart',
    GOOGLE_SEARCH = 'google_search',
    REDDIT = 'reddit',
    WIKIPEDIA = 'wikipedia',
    EXA = 'exa',
    ARXIV = 'arxiv',
    GOOGLE_KNOWLEDGE_GRAPH = 'google_knowledge_graph',
    WOLFRAM_ALPHA = 'wolfram_alpha',
    LM_STUDIO = 'lm_studio',
    CUSTOM = 'Custom',
}

export enum ModelApiType {
    LLM_MODEL = ApiType.LLM_MODEL,
    VISION_MODEL = ApiType.IMG_VISION,
    IMG_GENERATION = ApiType.IMG_GENERATION,
    SPEECH_TO_TEXT = ApiType.SPEECH_TO_TEXT,
    TEXT_TO_SPEECH = ApiType.TEXT_TO_SPEECH,
    EMBEDDINGS = ApiType.EMBEDDINGS,
    IMG_VISION = ApiType.IMG_VISION,
}

export enum LlmProvider {
    OPENAI = ApiName.OPENAI,
    AZURE = ApiName.AZURE,
    ANTHROPIC = ApiName.ANTHROPIC,
    LM_STUDIO = ApiName.LM_STUDIO,
    GEMINI = ApiName.GEMINI,
    MISTRAL = ApiName.MISTRAL,
    GROQ = ApiName.GROQ,
    LLAMA = ApiName.LLAMA,
    COHERE = ApiName.COHERE,
}

export interface API extends BaseDatabaseObject {
    api_type: ApiType;
    api_name: ApiName;
    name?: string;
    is_active: boolean;
    health_status: 'healthy' | 'unhealthy' | 'unknown';
    default_model?: AliceModel;
    api_config: APIConfig;
}

export const convertToAPI = (data: any): API => {
    return {
        ...convertToBaseDatabaseObject(data),
        api_type: data?.api_type || ApiType.LLM_MODEL,
        api_name: data?.api_name || '',
        name: data?.name || '',
        is_active: data?.is_active || false,
        health_status: data?.health_status || 'unknown',
        default_model: (data?.default_model && Object.keys(data.default_model).length > 0) ? convertToAliceModel(data.default_model) : undefined,
        api_config: data?.api_config ? convertToAPIConfig(data?.api_config) : { ...getDefaultAPIConfigForm() as APIConfig },
    };
};

export interface ApiComponentProps extends EnhancedComponentProps<API> {

}
export const getDefaultApiForm = (): Partial<API> => ({
    api_type: undefined,
    api_name: undefined,
    name: '',
    is_active: false,
    health_status: 'unknown',
    default_model: undefined,
    api_config: undefined,
});

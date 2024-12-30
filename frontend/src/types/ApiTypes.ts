import { AliceModel, convertToAliceModel } from "./ModelTypes";
import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from "./CollectionTypes";
import { APIConfig, convertToAPIConfig, getDefaultAPIConfigForm } from "./ApiConfigTypes";

export enum ApiType {
    ARXIV_SEARCH = 'arxiv_search',
    EMBEDDINGS = 'embeddings',
    EXA_SEARCH = 'exa_search',
    GOOGLE_KNOWLEDGE_GRAPH = 'google_knowledge_graph',
    GOOGLE_SEARCH = 'google_search',
    IMG_VISION = 'img_vision',
    IMG_GENERATION = 'img_generation',
    LLM_MODEL = 'llm_api',
    REDDIT_SEARCH = 'reddit_search',
    SPEECH_TO_TEXT = 'speech_to_text',
    REQUESTS = 'requests',
    TEXT_TO_SPEECH = 'text_to_speech',
    WIKIPEDIA_SEARCH = 'wikipedia_search',
    WOLFRAM_ALPHA = 'wolfram_alpha',
}

export enum ApiName {
    ANTHROPIC = 'anthropic',
    ARXIV = 'arxiv',
    AZURE = 'azure',
    COHERE = 'cohere',
    EXA = 'exa',
    GEMINI = 'gemini',
    GOOGLE_KNOWLEDGE_GRAPH = 'google_knowledge_graph',
    GOOGLE_SEARCH = 'google_search',
    GROQ = 'groq',
    DEEPSEEK = 'deepseek',
    LLAMA = 'llama',
    MISTRAL = 'mistral',
    OPENAI = 'openai',
    REDDIT = 'reddit',
    WIKIPEDIA = 'wikipedia',
    WOLFRAM_ALPHA = 'wolfram_alpha',
    
    BARK = 'bark',
    CUSTOM = 'Custom',
    LM_STUDIO = 'lm_studio',
    PIXART = 'pixart',
}

export enum ModelApiType {
    LLM_MODEL = ApiType.LLM_MODEL,
    EMBEDDINGS = ApiType.EMBEDDINGS,
    IMG_GENERATION = ApiType.IMG_GENERATION,
    IMG_VISION = ApiType.IMG_VISION,
    SPEECH_TO_TEXT = ApiType.SPEECH_TO_TEXT,
    TEXT_TO_SPEECH = ApiType.TEXT_TO_SPEECH,
}

export enum LlmProvider {
    ANTHROPIC = ApiName.ANTHROPIC,
    AZURE = ApiName.AZURE,
    COHERE = ApiName.COHERE,
    GEMINI = ApiName.GEMINI,
    GROQ = ApiName.GROQ,
    DEEPSEEK = ApiName.DEEPSEEK,
    LLAMA = ApiName.LLAMA,
    MISTRAL = ApiName.MISTRAL,
    OPENAI = ApiName.OPENAI,

    LM_STUDIO = ApiName.LM_STUDIO,
}

export interface API extends BaseDatabaseObject {
    api_type: ApiType;
    api_name: ApiName;
    name?: string;
    is_active: boolean;
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
    default_model: undefined,
    api_config: undefined,
});

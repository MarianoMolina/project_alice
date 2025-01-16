import { Schema } from 'mongoose';
import Logger from './logger';

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
// Base configurations
export interface BaseApiConfig {
    api_key: string;
    base_url: string;
}

export interface GoogleSearchConfig {
    api_key: string;
    cse_id: string;
}

export interface LocalApiConfig {
    base_url: string;
}

export interface RedditConfig {
    client_id: string;
    client_secret: string;
}

export interface WolframConfig {
    app_id: string;
}

export interface ExaConfig {
    api_key: string;
}

export type ApiConfigValue = 
    | BaseApiConfig 
    | GoogleSearchConfig 
    | RedditConfig 
    | EmptyConfig 
    | ExaConfig 
    | WolframConfig 
    | LocalApiConfig;

export type EmptyConfig = Record<string, never>;

export type ApiConfigType = {
    [ApiName.OPENAI]: BaseApiConfig;
    [ApiName.ANTHROPIC]: BaseApiConfig;
    [ApiName.GEMINI]: BaseApiConfig;
    [ApiName.MISTRAL]: BaseApiConfig;
    [ApiName.COHERE]: BaseApiConfig;
    [ApiName.LLAMA]: BaseApiConfig;
    [ApiName.AZURE]: BaseApiConfig;
    [ApiName.GROQ]: BaseApiConfig;
    [ApiName.DEEPSEEK]: BaseApiConfig;
    [ApiName.GOOGLE_SEARCH]: GoogleSearchConfig;
    [ApiName.REDDIT_SEARCH]: RedditConfig;
    [ApiName.WIKIPEDIA_SEARCH]: EmptyConfig;
    [ApiName.EXA_SEARCH]: ExaConfig;
    [ApiName.ARXIV_SEARCH]: EmptyConfig;
    [ApiName.GOOGLE_KNOWLEDGE_GRAPH]: ExaConfig;
    [ApiName.WOLFRAM_ALPHA]: WolframConfig;
    [ApiName.LM_STUDIO]: LocalApiConfig;
    [ApiName.CUSTOM]: BaseApiConfig;
    [ApiName.BARK]: EmptyConfig;
    [ApiName.PIXART_IMG_GEN]: EmptyConfig;
};

export function validateApiData(data: any, api_name: ApiName): boolean {
    Logger.debug(`Validating API data for ${api_name}`);
    Logger.debug(data);
    switch (api_name) {
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
            return (
                typeof data.api_key === 'string' &&
                typeof data.base_url === 'string'
            );

        case ApiName.GOOGLE_SEARCH:
            return (
                typeof data.api_key === 'string' &&
                typeof data.cse_id === 'string'
            );

        case ApiName.REDDIT_SEARCH:
            return (
                typeof data.client_id === 'string' &&
                typeof data.client_secret === 'string'
            );

        case ApiName.WIKIPEDIA_SEARCH:
        case ApiName.ARXIV_SEARCH:
        case ApiName.BARK:
        case ApiName.PIXART_IMG_GEN:
            return Object.keys(data).length === 0;

        case ApiName.EXA_SEARCH:
        case ApiName.GOOGLE_KNOWLEDGE_GRAPH:
            return typeof data.api_key === 'string';

        case ApiName.WOLFRAM_ALPHA:
            return typeof data.app_id === 'string';

        case ApiName.LM_STUDIO:
            return typeof data.base_url === 'string';
        default:
            return false;
    }
}

const baseApiConfigSchema = new Schema({
    api_key: { type: String, required: true },
    base_url: { type: String, required: true }
}, { _id: false });

const googleSearchConfigSchema = new Schema({
    api_key: { type: String, required: true },
    cse_id: { type: String, required: true }
}, { _id: false });

const localApiConfigSchema = new Schema({
    base_url: { type: String, required: true }
}, { _id: false });

const redditConfigSchema = new Schema({
    client_id: { type: String, required: true },
    client_secret: { type: String, required: true }
}, { _id: false });

const wolframConfigSchema = new Schema({
    app_id: { type: String, required: true }
}, { _id: false });

const exaConfigSchema = new Schema({
    api_key: { type: String, required: true }
}, { _id: false });

const emptyConfigSchema = new Schema({}, { _id: false });

export function getApiConfigSchema(apiName: ApiName) {
    switch (apiName) {
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
            return baseApiConfigSchema;
        case ApiName.GOOGLE_SEARCH:
            return googleSearchConfigSchema;
        case ApiName.REDDIT_SEARCH:
            return redditConfigSchema;
        case ApiName.WIKIPEDIA_SEARCH:
        case ApiName.ARXIV_SEARCH:
        case ApiName.BARK:
        case ApiName.PIXART_IMG_GEN:
            return emptyConfigSchema;
        case ApiName.EXA_SEARCH:
        case ApiName.GOOGLE_KNOWLEDGE_GRAPH:
            return exaConfigSchema;
        case ApiName.WOLFRAM_ALPHA:
            return wolframConfigSchema;
        case ApiName.LM_STUDIO:
            return localApiConfigSchema;
        default:
            throw new Error(`Unknown API name: ${apiName}`);
    }
}

export function createEmptyApiConfig(): ApiConfigType {
    return {
        [ApiName.OPENAI]: { api_key: '', base_url: '' },
        [ApiName.ANTHROPIC]: { api_key: '', base_url: '' },
        [ApiName.GEMINI]: { api_key: '', base_url: '' },
        [ApiName.MISTRAL]: { api_key: '', base_url: '' },
        [ApiName.COHERE]: { api_key: '', base_url: '' },
        [ApiName.LLAMA]: { api_key: '', base_url: '' },
        [ApiName.AZURE]: { api_key: '', base_url: '' },
        [ApiName.GROQ]: { api_key: '', base_url: '' },
        [ApiName.DEEPSEEK]: { api_key: '', base_url: '' },
        [ApiName.GOOGLE_SEARCH]: { api_key: '', cse_id: '' },
        [ApiName.REDDIT_SEARCH]: { client_id: '', client_secret: '' },
        [ApiName.WIKIPEDIA_SEARCH]: {},
        [ApiName.EXA_SEARCH]: { api_key: '' },
        [ApiName.ARXIV_SEARCH]: {},
        [ApiName.GOOGLE_KNOWLEDGE_GRAPH]: { api_key: '' },
        [ApiName.WOLFRAM_ALPHA]: { app_id: '' },
        [ApiName.LM_STUDIO]: { base_url: '' },
        [ApiName.CUSTOM]: { api_key: '', base_url: '' },
        [ApiName.BARK]: {},
        [ApiName.PIXART_IMG_GEN]: {}
    };
}

export interface ApiConfigMapsStructure {
    [key: string]: {
        [K in ApiName]: ApiConfigType[K] | undefined;
    };
}

export const validateApiConfigMap = (data: unknown): data is ApiConfigMapsStructure => {
    if (typeof data !== 'object' || data === null) return false;

    const obj = data as Record<string, ApiConfigType>;

    return Object.entries(obj).every(([key, apiConfig]) => {
        // Check if key is string and apiConfig is an object
        if (typeof key !== 'string' || typeof apiConfig !== 'object' || apiConfig === null) {
            return false;
        }

        // For each API config object, validate its structure based on api_name
        return Object.entries(apiConfig).every(([apiName, config]) => {
            // Validate that the apiName is valid
            if (!Object.values(ApiName).includes(apiName as ApiName)) {
                return false;
            }

            // Validate that config matches its expected type
            return validateApiData(config, apiName as ApiName);
        });
    });
};
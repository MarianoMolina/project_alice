import { Document, Types, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
import { ApiName } from './api.interface';

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

// Type for empty config
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
    [ApiName.BARK]: LocalApiConfig;
    [ApiName.PIXART_IMG_GEN]: LocalApiConfig;
};

export interface IAPIConfig {
    name: string;
    api_name: ApiName;
    data: ApiConfigType;
    health_status: 'healthy' | 'unhealthy' | 'unknown';
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface IAPIConfigMethods {
    apiRepresentation(): any;
}

export interface IAPIConfigDocument extends IAPIConfig, Document, IAPIConfigMethods {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAPIConfigModel extends Model<IAPIConfigDocument> {
    // Add any static methods here if needed
}
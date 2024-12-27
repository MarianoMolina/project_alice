import  { Document, Types, Model } from 'mongoose';
import { ApiName } from './api.interface';
import { IUserDocument } from './user.interface';

export enum ModelType {
    INSTRUCT = 'instruct',
    CHAT = 'chat',
    VISION = 'vision',
    STT = 'stt',
    TTS = 'tts',
    EMBEDDINGS = 'embeddings',
    IMG_GEN = 'img_gen',
}
export interface ChatTemplateTokens {
    bos: string;
    eos: string;
    // Optional role markers, if undefined will use default
    system_role?: string;
    user_role?: string;
    assistant_role?: string;
    tool_role?: string;
}

export interface ModelCosts {
    input_token_cost_per_million: number;
    cached_input_token_cost_per_million: number;
    output_token_cost_per_million: number;
    cost_per_unit?: number;
}

export interface IModelConfig {
    ctx_size: number;
    temperature: number;
    seed: number | null;
    use_cache: boolean;
    prompt_config: ChatTemplateTokens;
    max_tokens_gen?: number;
}

export interface IModel extends Document {
    short_name: string;
    model_name: string;
    api_name: ApiName;
    model_type: ModelType;
    config_obj?: IModelConfig;
    model_costs?: ModelCosts;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface IModelMethods {
    apiRepresentation(): any;
}

export interface IModelDocument extends IModel, Document, IModelMethods {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IModelModel extends Model<IModelDocument> {
    // Add any static methods here if needed
}
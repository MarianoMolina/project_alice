import  { Document, Types } from 'mongoose';

export interface IModel extends Document {
    short_name: string;
    model_name: string;
    model_format: string;
    ctx_size: number;
    model_type: 'instruct' | 'chat' | 'vision';
    deployment: 'local' | 'remote';
    model_file: string | null;
    api_key: string;
    port: number;
    api_type: 'openai' | 'azure' | 'anthropic';
    base_url: string;
    autogen_model_client_cls: string | null;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}


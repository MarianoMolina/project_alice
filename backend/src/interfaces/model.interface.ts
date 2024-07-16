import  { Document, Types } from 'mongoose';

export interface IModel extends Document {
    short_name: string;
    model_name: string;
    model_format: string;
    ctx_size: number;
    model_type: 'instruct' | 'chat' | 'vision';
    deployment: 'local' | 'remote';
    api_name: 'openai' | 'azure' | 'anthropic';
    temperature: number;
    seed: number | null;
    use_cache: boolean;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}


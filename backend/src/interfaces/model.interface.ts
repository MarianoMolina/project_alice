import  { Document, Types, Model } from 'mongoose';

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

export interface IModelMethods {
    apiRepresentation(): any;
}

export interface IModelDocument extends IModel, Document, IModelMethods {
    createdAt: Date;
    updatedAt: Date;
}

export interface IModelModel extends Model<IModelDocument> {
    // Add any static methods here if needed
}
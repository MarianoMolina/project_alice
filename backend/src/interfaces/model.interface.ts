import  { Document, Types, Model } from 'mongoose';
import { ApiName } from './api.interface';

export interface IModel extends Document {
    short_name: string;
    model_name: string;
    model_format: string;
    ctx_size: number;
    model_type: 'instruct' | 'chat' | 'vision';
    api_name: ApiName;
    temperature: number;
    seed: number | null;
    use_cache: boolean;
    lm_studio_preset: string;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
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
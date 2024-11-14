import { Document, Types, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
import { ApiName } from './api.interface';

export interface IAPIConfig {
    name: string;
    api_name: ApiName;
    data: Record<string, any>;
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
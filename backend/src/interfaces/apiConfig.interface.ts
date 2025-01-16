import { Document, Types, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
import { ApiConfigType, ApiName } from '../utils/api.utils';


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
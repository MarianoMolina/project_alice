import { Document, Types, Model } from 'mongoose';
import { IUserDocument } from './user.interface';

export interface IParameterDefinition {
    type: string;
    description: string;
    default: any;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface IParameterDefinitionMethods {
    apiRepresentation(): any;
}

export interface IParameterDefinitionDocument extends IParameterDefinition, Document, IParameterDefinitionMethods {
    _id: Types.ObjectId; 
    createdAt: Date;
    updatedAt: Date;
}

export interface IParameterDefinitionModel extends Model<IParameterDefinitionDocument> {
    // Add any static methods here if needed
}
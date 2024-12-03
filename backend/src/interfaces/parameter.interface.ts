import { Document, Types, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
export enum ParameterTypes {
    STRING = 'string',
    INTEGER = 'integer',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    OBJECT = 'object',
    ARRAY = 'array',
}
export interface IParameterDefinition {
    type: ParameterTypes;
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
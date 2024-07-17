import { Document, Types, Model } from 'mongoose';

export interface IParameterDefinition {
    type: string;
    description: string;
    default: any;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
}

export interface IParameterDefinitionMethods {
    apiRepresentation(): any;
}

export interface IParameterDefinitionDocument extends IParameterDefinition, Document, IParameterDefinitionMethods {
    createdAt: Date;
    updatedAt: Date;
}

export interface IParameterDefinitionModel extends Model<IParameterDefinitionDocument> {
    // Add any static methods here if needed
}
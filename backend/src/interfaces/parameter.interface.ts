import { Document, Types } from 'mongoose';

export interface IParameterDefinition {
    type: string;
    description: string;
    default: any;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
}

export interface IParameterDefinitionDocument extends IParameterDefinition, Document {
    createdAt: Date;
    updatedAt: Date;
}

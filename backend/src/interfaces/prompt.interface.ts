import { Document, Types, Model } from 'mongoose';
import { IFunctionParameters } from '../utils/schemas';

export interface IPrompt {
    name: string;
    content: string;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
    is_templated: boolean;
    parameters: IFunctionParameters | null;
    partial_variables: Map<string, any>;
    version: number;
}

export interface IPromptMethods {
  apiRepresentation(): any;
}

export interface IPromptDocument extends IPrompt, Document, IPromptMethods {
  createdAt: Date;
  updatedAt: Date;
}

export interface IPromptModel extends Model<IPromptDocument> {
  // Add any static methods here if needed
}
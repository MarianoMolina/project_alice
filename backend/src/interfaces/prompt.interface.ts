import { Document, Types, Model } from 'mongoose';
import { IFunctionParameters } from '../utils/functionSchema';
import { IUserDocument } from './user.interface';

export interface IPrompt {
    name: string;
    content: string;
    is_templated: boolean;
    parameters: IFunctionParameters | null;
    partial_variables: Map<string, any>;
    version: number;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
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
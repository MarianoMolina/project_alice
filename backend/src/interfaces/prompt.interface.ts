import { Document, Types } from 'mongoose';
import { IFunctionParameters } from '../utils/schemas';


export interface IPrompt {
    name: string;
    content: string;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
    is_templated: boolean;
    parameters: IFunctionParameters; // Type this more specifically if possible
    partial_variables: Map<string, any>;
    version: number;
}

export interface IPromptDocument extends IPrompt, Document {
    createdAt: Date;
    updatedAt: Date;
    apiRepresentation: () => any;
}
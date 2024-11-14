import { Document, Types, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
import { Embeddable } from './embeddingChunk.interface';

export interface ToolCallConfig {
    arguments: Record<string, any> | string;
    name: string;
}

export interface IToolCall extends Embeddable {
    type: "function";
    function: ToolCallConfig;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface IToolCallMethods {
    apiRepresentation(): any;
}

export interface IToolCallDocument extends IToolCall, Document, IToolCallMethods {
    _id: Types.ObjectId; 
    createdAt: Date;
    updatedAt: Date;
}

export interface IToolCallModel extends Model<IToolCallDocument> {
    // Add any static methods here if needed
}
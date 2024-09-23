import { Model, Types, Document } from 'mongoose';
import { IMessageDocument } from './message.interface';

// ChangeHistory interfaces
export interface IChangeHistory {
    previous_agent: Types.ObjectId | null;
    updated_agent: Types.ObjectId | null;
    previous_functions: Types.ObjectId[];
    updated_functions: Types.ObjectId[];
    changed_by: Types.ObjectId;
    timestamp: Date;
}

export interface IChangeHistoryDocument extends IChangeHistory, Document {
    apiRepresentation: () => any;
}

// AliceChat interfaces
export interface IAliceChat {
    name: string;
    messages: IMessageDocument[];
    changeHistory: IChangeHistoryDocument[];
    alice_agent: Types.ObjectId;
    functions: Types.ObjectId[];
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
}

export interface IAliceChatMethods {
    apiRepresentation(): any;
}

export interface IAliceChatDocument extends IAliceChat, Document, IAliceChatMethods {
    createdAt: Date;
    updatedAt: Date;
}

export interface IAliceChatModel extends Model<IAliceChatDocument> {
    // Add any static methods here if needed
}
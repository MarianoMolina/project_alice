import { Model, Types, Document } from 'mongoose';

// ChangeHistory interfaces
export interface IChangeHistory {
    previous_agent: Types.ObjectId | null;
    updated_agent: Types.ObjectId | null;
    previous_executor: Types.ObjectId | null;
    updated_executor: Types.ObjectId | null;
    previous_functions: Types.ObjectId[];
    updated_functions: Types.ObjectId[];
    previous_task_responses: Types.ObjectId[];
    updated_task_responses: Types.ObjectId[];
    previous_model_id: any;
    updated_model_id: any;
    changed_by: Types.ObjectId;
    timestamp: Date;
}

export interface IChangeHistoryDocument extends IChangeHistory, Document {
    apiRepresentation: () => any;
}
export interface IMessage {
    _id?: Types.ObjectId;  // Add this line
    content: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    generated_by: 'user' | 'llm' | 'tool';
    step: string;
    assistant_name: string;
    context: any;
    type: string;
    tool_calls: any[];
    request_type: string | null;
    created_by: Types.ObjectId;
    task_responses: Types.ObjectId[];
}

export interface IMessageDocument extends IMessage, Document {
    _id: Types.ObjectId;  // This ensures _id is always present in IMessageDocument
    createdAt: Date;
    updatedAt: Date;
    apiRepresentation: () => any;
}

// AliceChat interfaces
export interface IAliceChat {
    name: string;
    messages: IMessageDocument[];
    changeHistory: IChangeHistoryDocument[];
    alice_agent: Types.ObjectId;
    functions: Types.ObjectId[];
    executor: Types.ObjectId;
    model_id: any;
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
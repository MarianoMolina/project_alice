import { Types } from "mongoose";

export interface IMessage {
    _id?: Types.ObjectId;
    content?: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    generated_by: 'user' | 'llm' | 'tool';
    step: string;
    assistant_name?: string;
    context?: any;
    type: string;
    tool_calls?: any[];
    tool_call_id?: string,
    request_type?: string | null;
    references?: Types.ObjectId[];
    task_responses?: Types.ObjectId[];
    creation_metadata?: Record<string, any>;
}

export interface IMessageDocument extends IMessage, Document {
    _id: Types.ObjectId;  // This ensures _id is always present in IMessageDocument
    created_by: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    apiRepresentation: () => any;
}


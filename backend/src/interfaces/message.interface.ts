import { Types } from "mongoose";
import { IFileReferenceDocument } from "./file.interface";
import { ITaskResultDocument } from "./taskResult.interface";
import { IUserDocument } from "./user.interface";

export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'task_result';

export interface IMessage {
    content?: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    generated_by: 'user' | 'llm' | 'tool';
    step: string;
    assistant_name?: string;
    context?: any;
    type: ContentType;
    tool_calls?: any[];
    tool_call_id?: string,
    request_type?: string | null;
    references?: Types.ObjectId[] | IFileReferenceDocument[];
    task_responses?: Types.ObjectId[] | ITaskResultDocument[];
    creation_metadata?: Record<string, any>;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface IMessageDocument extends IMessage, Document {
    _id: Types.ObjectId; 
    createdAt: Date;
    updatedAt: Date;
    apiRepresentation: () => any;
}
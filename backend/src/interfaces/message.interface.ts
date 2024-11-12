import { Model, Types, Document } from 'mongoose';
import { IUserDocument } from "./user.interface";
import { References } from './references.interface';
import { FileType } from './file.interface';
import { Embeddable } from './embeddingChunk.interface';

export enum ContentType {
    TEXT = 'text',
    IMAGE = FileType.IMAGE,
    VIDEO = FileType.VIDEO,
    AUDIO = FileType.AUDIO,
    FILE = FileType.FILE,
    TASK_RESULT = 'task_result',
    MULTIPLE = 'multiple',
    URL_REFERENCE = 'url_reference'
}
export enum RoleType {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system',
    TOOL = 'tool'
}

export enum MessageGenerators {
    USER = 'user',
    LLM = 'llm',
    TOOL = 'tool',
    SYSTEM = 'system'
}

export interface IMessage extends Embeddable {
    content?: string;
    role: RoleType;
    generated_by: MessageGenerators;
    step: string;
    assistant_name?: string;
    type: ContentType;
    references?: References;
    creation_metadata?: Record<string, any>;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface IMessageMethods {
    apiRepresentation(): any;
}

export interface IMessageDocument extends IMessage, Document, IMessageMethods {
    _id: Types.ObjectId; 
    createdAt: Date;
    updatedAt: Date;
}

export interface IMessageModel extends Model<IMessageDocument> {
    // Add any static methods here if needed
}
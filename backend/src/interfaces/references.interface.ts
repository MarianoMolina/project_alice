import { Document, Types, Model } from 'mongoose';
import { IFileReferenceDocument } from "./file.interface";
import { IMessageDocument } from "./message.interface";
import { ITaskResultDocument } from "./taskResult.interface";
import { IUserInteractionDocument } from "./userInteraction.interface";
import { IEmbeddingChunkDocument } from './embeddingChunk.interface';
import { IUserDocument } from './user.interface';
import { IToolCallDocument } from './toolCall.interface';
import { ICodeExecutionDocument } from './codeExecution.interface';
import { IEntityReferenceDocument } from './entityReference.interface';

export interface References {
    messages?: Types.ObjectId[] | IMessageDocument[];
    files?: Types.ObjectId[] | IFileReferenceDocument[];
    task_responses?: Types.ObjectId[] | ITaskResultDocument[];
    entity_references?: Types.ObjectId[] | IEntityReferenceDocument[];
    user_interactions?: Types.ObjectId[] | IUserInteractionDocument[];
    embeddings?: Types.ObjectId[] | IEmbeddingChunkDocument[];
    tool_calls?: Types.ObjectId[] | IToolCallDocument[];
    code_executions?: Types.ObjectId[] | ICodeExecutionDocument[];
}

export interface ReferencesMethods {
    apiRepresentation(): any;
}

export interface IDataClusterDocument extends References, Document, ReferencesMethods {
    _id: Types.ObjectId;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
    createdAt: Date;
    updatedAt: Date;
}

export interface IDataClusterModel extends Model<IDataClusterDocument> {
    // Add any static methods here if needed
}
import { Document, Types, Model } from 'mongoose';
import { IFileReferenceDocument } from "./file.interface";
import { IMessageDocument } from "./message.interface";
import { ITaskResultDocument } from "./taskResult.interface";
import { IURLReferenceDocument } from "./urlReference.interface";
import { IUserInteractionDocument } from "./userInteraction.interface";
import { IEmbeddingChunkDocument } from './embeddingChunk.interface';
import { IUserDocument } from './user.interface';

export interface References {
    messages?: Types.ObjectId[] | IMessageDocument[];
    files?: Types.ObjectId[] | IFileReferenceDocument[];
    task_responses?: Types.ObjectId[] | ITaskResultDocument[];
    url_references?: Types.ObjectId[] | IURLReferenceDocument[];
    string_outputs?: string[];
    user_interactions?: Types.ObjectId[] | IUserInteractionDocument[];
    embedding_chunks?: Types.ObjectId[] | IEmbeddingChunkDocument[];
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
import { Document, Types, Model } from 'mongoose';
import { IMessageDocument } from './message.interface';
import { IUserDocument } from './user.interface';
import { Embeddable } from './embeddingChunk.interface';

export enum FileType {
    IMAGE = "image",
    AUDIO = "audio",
    VIDEO = "video",
    FILE = "file",
}

export interface IFileReference extends Embeddable {
    filename: string;
    type: FileType;
    file_size: number;
    storage_path: string;
    transcript?: Types.ObjectId | IMessageDocument;
    content?: string;
    last_accessed?: Date;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface IFileReferenceMethods {
    apiRepresentation(): any;
}

export interface IFileReferenceDocument extends IFileReference, Document, IFileReferenceMethods {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IFileReferenceModel extends Model<IFileReferenceDocument> {
    // Add any static methods here if needed
}
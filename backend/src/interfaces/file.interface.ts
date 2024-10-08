import { Document, Types, Model } from 'mongoose';
import { IMessageDocument } from './message.interface';
import { IUserDocument } from './user.interface';

export enum FileType {
    IMAGE = "image",
    AUDIO = "audio",
    VIDEO = "video",
    FILE = "file",
}

export interface IFileReference {
    filename: string;
    type: FileType;
    file_size: number;
    storage_path: string;
    transcript?: Types.ObjectId | IMessageDocument;
    content?: string;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
    last_accessed?: Date;
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
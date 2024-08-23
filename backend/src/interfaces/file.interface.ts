import { Document, Types, Model } from 'mongoose';

export enum ContentType {
    TEXT = "text",
    IMAGE = "image",
    AUDIO = "audio",
    VIDEO = "video",
    FILE = "file",
}

export interface IFileReference {
    filename: string;
    type: ContentType;
    file_size: number;
    storage_path: string;
    file_url: string; 
    created_by: Types.ObjectId;
    last_accessed?: Date;
}

export interface IFileReferenceMethods {
    apiRepresentation(): any;
}

export interface IFileReferenceDocument extends IFileReference, Document, IFileReferenceMethods {
    createdAt: Date;
    updatedAt: Date;
}

export interface IFileReferenceModel extends Model<IFileReferenceDocument> {
    // Add any static methods here if needed
}
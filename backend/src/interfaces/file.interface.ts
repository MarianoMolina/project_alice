import { Document, Types, Model } from 'mongoose';

export enum FileType {
    TEXT = "text",
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

export interface FileContentReference {
    _id?: string;
    filename: string;
    type: FileType;
    content: string; // base64 encoded content
    created_by?: string;
}

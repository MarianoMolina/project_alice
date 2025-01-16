import { Model, Types } from "mongoose";
import { IMessageDocument } from "./message.interface";
import { IUserDocument } from "./user.interface";
import { Document } from "mongoose";

export interface IChatThread {
    name?: string;
    messages: Types.ObjectId[] | IMessageDocument[];
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface IChatThreadMethods {
    apiRepresentation(): any;
}

export interface IChatThreadDocument extends IChatThread, Document, IChatThreadMethods {
    _id: Types.ObjectId; 
    createdAt: Date;
    updatedAt: Date;
}

export interface IChatThreadModel extends Model<IChatThreadDocument> {
    // Add any static methods here if needed
}
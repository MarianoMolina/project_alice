import { Document, Model, Types } from "mongoose";
import { IUserDocument } from "./user.interface";
import { Embeddable } from "./embeddingChunk.interface";
import { ApiType } from "./api.interface";

export interface IImageReference {
    url: string;
    alt?: string;
    caption?: string;
}

export interface IReferenceCategory {
    name: string;
    type?: string;
    description?: string;
}

export interface IEntityConnection {
    entityId: Types.ObjectId;
    relationshipType: string;
    metadata?: Record<string, any>;
}

export interface IEntityReference extends Embeddable {
    source_id?: string;
    name?: string;
    description?: string;
    content?: string;
    url?: string;
    images: IImageReference[];
    categories: IReferenceCategory[];
    source?: ApiType;
    connections: IEntityConnection[];
    metadata?: Record<string, any>;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface IEntityReferenceMethods {
    apiRepresentation(): any;
}

export interface IEntityReferenceDocument extends IEntityReference, Document, IEntityReferenceMethods {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IEntityReferenceModel extends Model<IEntityReferenceDocument> {
    // Add any static methods here if needed
}

import { Document, Model, Types } from "mongoose";
import { IUserDocument } from "./user.interface";
import { Embeddable } from "./embeddingChunk.interface";

export interface IURLReference extends Embeddable {
  title: string;
  url: string;
  content: string;
  metadata: { [key: string]: string };
  created_by: Types.ObjectId | IUserDocument;
  updated_by: Types.ObjectId | IUserDocument;
}

export interface IURLReferenceMethods {
  apiRepresentation(): any;
}

export interface IURLReferenceDocument extends IURLReference, Document, IURLReferenceMethods {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IURLReferenceModel extends Model<IURLReferenceDocument> {
  // Add any static methods here if needed
}
import { Document, Model, Types } from "mongoose";

export interface IURLReference {
    title: string;
    url: string;
    content: string;
    metadata: { [key: string]: string };
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
}

export interface IURLReferenceMethods {
    apiRepresentation(): any;
  }
  
  export interface IURLReferenceDocument extends IURLReference, Document, IURLReferenceMethods {
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface IURLReferenceModel extends Model<IURLReferenceDocument> {
    // Add any static methods here if needed
  }
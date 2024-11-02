import { Document, Types, Model } from 'mongoose';
import { IUserDocument } from './user.interface';

export interface IEmbeddingChunk {
  vector: number[];
  text_content: string;
  index: number;
  creation_metadata: Record<string, any>;
  created_by: Types.ObjectId | IUserDocument;
  updated_by: Types.ObjectId | IUserDocument;
}

export interface IEmbeddingChunkMethods {
  apiRepresentation(): any;
}

export interface IEmbeddingChunkDocument extends IEmbeddingChunk, Document, IEmbeddingChunkMethods {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmbeddingChunkModel extends Model<IEmbeddingChunkDocument> {
  // Add any static methods here if needed
}

export interface embeddable {
  embeddings: IEmbeddingChunkDocument[] | Types.ObjectId[];
}
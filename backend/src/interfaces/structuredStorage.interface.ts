// src/interfaces/structuredStorage.interface.ts
import { Document, Types, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
import { ApiConfigType } from './apiConfig.interface';
import { ApiName } from './api.interface';

// Define available structure types
export enum StructureType {
  API_CONFIG_MAPS = 'api_config_maps',
  // Add more structure types here as needed
}

// Define the shape of each structure type
export interface ApiConfigMapsStructure {
    [key: string]: {
        [K in ApiName]: ApiConfigType[K] | undefined;
    };
}

// Union type for all possible structure types
export type StructureDataType = {
  [StructureType.API_CONFIG_MAPS]: ApiConfigMapsStructure;
  // Add more mappings here as new structure types are added
}

// Main interface for the document
export interface IStructuredStorage {
  name: string;
  type: StructureType;
  data: StructureDataType[keyof StructureDataType];  // Using keyof for better type safety
  is_active: boolean;
  created_by: Types.ObjectId | IUserDocument;
  updated_by: Types.ObjectId | IUserDocument;
}

// Document methods interface
export interface IStructuredStorageMethods {
  validateData(): boolean;
  getTypedData<T extends StructureType>(): StructureDataType[T];
}

// Document interface combining the base interface, methods, and Document type
export interface IStructuredStorageDocument extends IStructuredStorage, Document, IStructuredStorageMethods {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Model interface for static methods
export interface IStructuredStorageModel extends Model<IStructuredStorageDocument> {
  findByType(type: StructureType): Promise<IStructuredStorageDocument[]>;
  validateStructureData(type: StructureType, data: unknown): boolean;
}
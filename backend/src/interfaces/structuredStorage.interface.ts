import { Document, Types, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
import { ApiConfigMapsStructure } from '../utils/api.utils';

export enum StructureType {
  API_CONFIG_MAPS = 'api_config_maps',
}

export type StructureDataType = {
  [StructureType.API_CONFIG_MAPS]: ApiConfigMapsStructure;
}

export interface IStructuredStorage {
  name: string;
  type: StructureType;
  data: StructureDataType[keyof StructureDataType];
  is_active: boolean;
  created_by: Types.ObjectId | IUserDocument;
  updated_by: Types.ObjectId | IUserDocument;
}

export interface IStructuredStorageMethods {
  validateData(): boolean;
  getTypedData<T extends StructureType>(): StructureDataType[T];
}

export interface IStructuredStorageDocument extends IStructuredStorage, Document, IStructuredStorageMethods {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStructuredStorageModel extends Model<IStructuredStorageDocument> {
  findByType(type: StructureType): Promise<IStructuredStorageDocument[]>;
  validateStructureData(type: StructureType, data: unknown): boolean;
}
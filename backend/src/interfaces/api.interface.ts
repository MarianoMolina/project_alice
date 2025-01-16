import { Types, Model, Document } from 'mongoose';
import { IUserDocument } from './user.interface';
import { IAPIConfigDocument } from './apiConfig.interface';
import { ApiName, ApiType } from '../utils/api.utils';

export interface IAPI {
  api_type: ApiType;
  name: string;
  api_name: ApiName;
  is_active: boolean;
  default_model?: Types.ObjectId;
  api_config?: Types.ObjectId | IAPIConfigDocument;
  created_by: Types.ObjectId | IUserDocument;
  updated_by: Types.ObjectId | IUserDocument;
}

export interface IAPIMethods {
  apiRepresentation(): any;
}

export interface IAPIDocument extends IAPI, Document, IAPIMethods {
  createdAt: Date;
  updatedAt: Date;
}

export interface IAPIModel extends Model<IAPIDocument> {
  // Add any static methods here if needed
}

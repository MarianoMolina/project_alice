import { Types } from 'mongoose';
import { IAPIEngine } from './schemas';

export type ObjectWithId = { _id: Types.ObjectId | string } | Types.ObjectId | string;

export function getObjectId(id: any): Types.ObjectId {
  if (id instanceof Types.ObjectId) {
    return id;
  } else if (typeof id === 'string') {
    return new Types.ObjectId(id);
  } else if (id && id._id) {
    return getObjectId(id._id);
  } else {
    throw new Error(`Invalid ID: ${id}`);
  }
}

export function ensureObjectIdHelper(value: any): Types.ObjectId | any {
  if (value && typeof value === 'object' && '_id' in value) {
    return value._id;
  }
  return value;
}

export function ensureObjectIdForProperties(properties: Map<string, Types.ObjectId> | { [key: string]: any }) {
  let propertiesMap: Map<string, Types.ObjectId>;

  if (properties instanceof Map) {
    propertiesMap = properties;
  } else if (typeof properties === 'object' && properties !== null) {
    propertiesMap = new Map<string, Types.ObjectId>(Object.entries(properties));
  } else {
    throw new Error('Invalid input: properties must be a Map or an Object');
  }

  for (const [key, value] of propertiesMap.entries()) {
    propertiesMap.set(key, ensureObjectIdHelper(value));
  }

  return propertiesMap;
}

export function ensureObjectIdForAPIEngine(apiEngine: IAPIEngine) {
  ensureObjectIdForProperties(apiEngine.input_variables.properties);
}

import { Types } from 'mongoose';

export function getObjectId(id: any): Types.ObjectId {
  if (id instanceof Types.ObjectId) {
    return id;
  } else if (typeof id === 'string') {
    return new Types.ObjectId(id);
  } else if (id && id._id) {
    return getObjectId(id._id);
  } else if (id && id.id) {
    return getObjectId(id.id);
  } else {
    throw new Error(`Invalid ID: ${id}`);
  }
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
    propertiesMap.set(key, getObjectId(value));
  }

  return propertiesMap;
}
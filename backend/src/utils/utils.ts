import { Types } from 'mongoose';
import Logger from './logger';

export function getObjectId(id: any): Types.ObjectId {
  console.log('getObjectId received:', {
    value: id === null ? 'null' : 
          id === undefined ? 'undefined' : 
          typeof id === 'object' ? JSON.stringify(id) : 
          String(id),
    type: typeof id,
    isObjectId: id instanceof Types.ObjectId,
    hasId: id?.id !== undefined,
    has_id: id?._id !== undefined
  });

  try {
    if (id instanceof Types.ObjectId) {
      console.log('Returning existing ObjectId');
      return id;
    } else if (typeof id === 'string') {
      console.log('Converting string to ObjectId');
      return new Types.ObjectId(id);
    } else if (id && id._id) {
      console.log('Found _id property, recursing');
      return getObjectId(id._id);
    } else if (id && id.id) {
      console.log('Found id property, recursing');
      return getObjectId(id.id);
    } else {
      const idType = typeof id;
      const idValue = id === null ? 'null' :
        id === undefined ? 'undefined' :
        typeof id === 'object' ? JSON.stringify(id) :
        String(id);

      console.log('No valid ID found to convert:', { idType, idValue });
      throw new Error(`Invalid ObjectId: received ${idType} with value ${idValue}`);
    }
  } catch (error) {
    const stack = error instanceof Error ? error.stack : new Error().stack;
    const errorDetails = {
      receivedValue: id === null ? 'null' :
        id === undefined ? 'undefined' :
        typeof id === 'object' ? JSON.stringify(id) :
        String(id),
      receivedType: typeof id,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: stack
    };

    Logger.error('Error getting ObjectId:', {
      error: errorDetails,
      stack: stack
    });

    return id;
  }
}

export function ensureObjectIdForProperties(
  properties: Map<string, Types.ObjectId> | { [key: string]: any }
): Map<string, Types.ObjectId> {
  try {
    let propertiesMap: Map<string, Types.ObjectId>;

    if (properties instanceof Map) {
      propertiesMap = properties;
    } else if (typeof properties === 'object' && properties !== null) {
      propertiesMap = new Map<string, Types.ObjectId>(Object.entries(properties));
    } else {
      throw new Error(`Invalid input: properties must be a Map or an Object, received ${typeof properties}`);
    }

    for (const [key, value] of propertiesMap.entries()) {
      try {
        propertiesMap.set(key, getObjectId(value));
      } catch (error) {
        // Log specific property conversion errors
        Logger.error(`Error converting property "${key}" to ObjectId:`, {
          key,
          value: value === null ? 'null' :
            value === undefined ? 'undefined' :
              typeof value === 'object' ? JSON.stringify(value) :
                String(value),
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }

    return propertiesMap;
  } catch (error) {
    const stack = error instanceof Error ? error.stack : new Error().stack;

    Logger.error('Error in ensureObjectIdForProperties:', {
      error: error instanceof Error ? error.message : String(error),
      properties: typeof properties === 'object' ? JSON.stringify(properties) : String(properties),
      stack: stack
    });

    throw error;
  }
}

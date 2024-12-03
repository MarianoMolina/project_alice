import { Types } from 'mongoose';
import Logger from './logger';

interface IdContext {
  model: string;
  field: string;
}

export function getObjectId(id: any, context?: IdContext): Types.ObjectId {
  try {
    if (id instanceof Types.ObjectId) {
      return id;
    } else if (typeof id === 'string') {
      return new Types.ObjectId(id);
    } else if (id && id._id) {
      return getObjectId(id._id, context);
    } else if (id && id.id) {
      return getObjectId(id.id, context);
    }

    throw new Error(`Invalid ObjectId: received ${typeof id}`);
  } catch (error) {
    const errorMsg = `ObjectId conversion failed${context ? ` for ${context.model}.${context.field}` : ''}`;
    Logger.error(errorMsg, { 
      value: id === null ? 'null' : 
             id === undefined ? 'undefined' : 
             typeof id === 'object' ? JSON.stringify(id) : String(id),
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export function getObjectIdForList(list: any[], context?: IdContext): Types.ObjectId[] {
  return list.map(item => getObjectId(item, context));
}

export function getObjectIdForMap<K extends string | number | symbol>(
  map: Map<K, any> | Record<K, any>, 
  context?: IdContext
): Map<K, Types.ObjectId> {
  const result = new Map<K, Types.ObjectId>();
  const entries = map instanceof Map ? map.entries() : Object.entries(map) as [K, any][];
  
  for (const [key, value] of entries) {
    if (value) {
      try {
        result.set(key, getObjectId(value, context));
      } catch (error) {
        Logger.error(`Failed to convert map value for key ${String(key)}`, { context, error });
      }
    }
  }
  
  return result;
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

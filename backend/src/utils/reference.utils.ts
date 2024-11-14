import { Types } from 'mongoose';
import { References } from '../interfaces/references.interface';
import { InteractionOwnerType } from '../interfaces/userInteraction.interface';
import Logger from './logger';
import { updateFile, storeFileReference } from './file.utils';
import { updateTaskResult, createTaskResult } from './taskResult.utils';
import { createMessage, updateMessage } from './message.utils';
import { createURLReference, updateURLReference } from './urlReference.utils';
import { createUserInteraction, updateUserInteraction } from './userInteraction.utils';
import { createEmbeddingChunk, updateEmbeddingChunk } from './embeddingChunk.utils';
import { createToolCall, updateToolCall } from './toolCall.utils';
import { createCodeExecution, updateCodeExecution } from './codeExecution.utils';

// Add interface for owner information
interface OwnerInfo {
  id: string;
  type: InteractionOwnerType;
}

interface ProcessReferenceOptions {
  userId: string;
  owner?: OwnerInfo;
}

interface ReferenceUtils {
  create: (data: any, userId: string) => Promise<any>;
  update: (id: string, data: any, userId: string) => Promise<any>;
}

const referenceUtilsMap: Record<keyof References, ReferenceUtils> = {
  messages: {
    create: createMessage,
    update: updateMessage
  },
  files: {
    create: storeFileReference,
    update: updateFile
  },
  task_responses: {
    create: createTaskResult,
    update: updateTaskResult
  },
  url_references: {
    create: createURLReference,
    update: updateURLReference
  },
  user_interactions: {
    create: createUserInteraction,
    update: updateUserInteraction
  },
  embeddings: {
    create: createEmbeddingChunk,
    update: updateEmbeddingChunk
  },
  tool_calls: {
    create: createToolCall,
    update: updateToolCall
  },
  code_executions: {
    create: createCodeExecution,
    update: updateCodeExecution
  }
};

async function processReferenceArray(
  referenceArray: any[],
  refType: keyof References,
  options: ProcessReferenceOptions
): Promise<Types.ObjectId[]> {
  const utils = referenceUtilsMap[refType];
  
  return Promise.all(
    referenceArray
      .filter(ref => ref !== null)
      .map(async (ref) => {
        try {
          if (typeof ref === 'string' || ref instanceof Types.ObjectId) {
            return new Types.ObjectId(ref);
          } else if ('_id' in ref && ref._id) {
            // If it's a user interaction and we have owner info, set it
            if (refType === 'user_interactions' && options.owner) {
              ref.owner = {
                type: options.owner.type,
                id: new Types.ObjectId(options.owner.id)
              };
            }
            const updated = await utils.update(ref._id.toString(), ref, options.userId);
            return updated?._id || new Types.ObjectId(ref._id);
          } else {
            // For new user interactions, check and set owner
            if (refType === 'user_interactions') {
              if (options.owner) {
                ref.owner = {
                  type: options.owner.type,
                  id: new Types.ObjectId(options.owner.id)
                };
              } else if (!ref.owner) {
                Logger.warn('User interaction created without owner information', {
                  interaction: ref
                });
              }
            }
            const created = await utils.create(ref, options.userId);
            if (!created) {
              Logger.error(`Failed to create ${refType}`);
              Logger.error(JSON.stringify(ref));
              throw new Error(`Failed to create ${refType}`);
            }
            return created._id;
          }
        } catch (error) {
          Logger.error(`Error processing ${refType}:`, error);
          throw error;
        }
      })
  );
}

export async function processReferences(
  references: References | undefined, 
  userId: string,
  owner?: OwnerInfo
): Promise<References> {
  Logger.debug('Processing references', {
    references: references,
    userId: userId,
    owner: owner
  });
  
  if (!references) {
    return {};
  }

  const processedReferences: References = {};
  const options: ProcessReferenceOptions = { userId, owner };
  
  for (const [refType, refArray] of Object.entries(references)) {
    if (refArray && Array.isArray(refArray)) {
      try {
        processedReferences[refType as keyof References] = await processReferenceArray(
          refArray,
          refType as keyof References,
          options
        );
      } catch (error) {
        Logger.error(`Error processing ${refType}:`, error);
        throw error;
      }
    }
  }

  return processedReferences;
}

function compareArrays<T extends Types.ObjectId | { _id: Types.ObjectId } | string>(
  arr1: T[] | undefined,
  arr2: T[] | undefined
): boolean {
  if (!arr1 && !arr2) return true;
  if (!arr1 || !arr2) return false;
  if (arr1.length !== arr2.length) return false;

  return arr1.every((item, index) => {
    const item1 = item instanceof Types.ObjectId ? item : (item as { _id: Types.ObjectId })._id;
    const item2 = arr2[index] instanceof Types.ObjectId ? arr2[index] : (arr2[index] as { _id: Types.ObjectId })._id;

    if (item1 instanceof Types.ObjectId && item2 instanceof Types.ObjectId) {
      return item1.equals(item2);
    }
    return item1 === item2;
  });
}

export function compareReferences(ref1: References | undefined, ref2: References | undefined): boolean {
  if (!ref1 && !ref2) return true;
  if (!ref1 || !ref2) return false;

  // Use the keys from our utilsMap to ensure we're checking all reference types
  const keys = Object.keys(referenceUtilsMap) as (keyof References)[];

  for (const key of keys) {
    const arr1 = ref1[key] as (Types.ObjectId | { _id: Types.ObjectId })[] | undefined;
    const arr2 = ref2[key] as (Types.ObjectId | { _id: Types.ObjectId })[] | undefined;
    if (!compareArrays(arr1, arr2)) return false;
  }

  return true;
}
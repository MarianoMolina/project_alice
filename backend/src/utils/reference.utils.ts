import { Types } from 'mongoose';
import { References } from '../interfaces/references.interface';
import { updateFile, storeFileReference } from './file.utils';
import { updateTaskResult, createTaskResult } from './taskResult.utils';
import Logger from './logger';
import { createMessage, updateMessage } from './message.utils';
import { createURLReference, updateURLReference } from './urlReference.utils';

export async function processReferences(references: References | undefined, userId: string): Promise<References> {
  const processedReferences: References = {};

  if (!references) {
    return processedReferences;
  }

  if (references.files && Array.isArray(references.files)) {
    processedReferences.files = await Promise.all(references.files.map(async (ref) => {
      if (typeof ref === 'string' || ref instanceof Types.ObjectId) {
        return new Types.ObjectId(ref);
      } else if ('_id' in ref && ref._id) {
        const updatedRef = await updateFile(ref._id.toString(), ref, userId);
        return updatedRef?._id || new Types.ObjectId(ref._id);
      } else {
        const newRef = await storeFileReference(ref, userId);
        return newRef._id;
      }
    }));
  }

  if (references.task_responses && Array.isArray(references.task_responses)) {
    processedReferences.task_responses = await Promise.all(references.task_responses.map(async (ref) => {
      if (typeof ref === 'string' || ref instanceof Types.ObjectId) {
        return new Types.ObjectId(ref);
      } else if ('_id' in ref && ref._id) {
        const updatedTR = await updateTaskResult(ref._id.toString(), ref, userId);
        return updatedTR?._id || new Types.ObjectId(ref._id);
      } else {
        const newTR = await createTaskResult(ref, userId);
        if (!newTR) {
          Logger.error('Failed to create task response');
          Logger.error(JSON.stringify(ref));
          throw new Error('Failed to create task response');
        }
        return newTR._id;
      }
    }));
  }
  if (references.messages && Array.isArray(references.messages)) {
    processedReferences.messages = await Promise.all(references.messages.map(async (ref) => {
      if (typeof ref === 'string' || ref instanceof Types.ObjectId) {
        return new Types.ObjectId(ref);
      } else if ('_id' in ref && ref._id) {
        const updatedMsg = await updateMessage(ref._id.toString(), ref, userId);
        return updatedMsg?._id || new Types.ObjectId(ref._id);
      } else {
        const newMsg = await createMessage(ref, userId);
        if (!newMsg) {
          Logger.error('Failed to create message');
          Logger.error(JSON.stringify(ref));
          throw new Error('Failed to create message');
        }
        return newMsg._id;
      }
    }));
  }
  if (references.search_results && Array.isArray(references.search_results)) {
    processedReferences.search_results = await Promise.all(references.search_results.map(async (ref) => {
      if (typeof ref === 'string' || ref instanceof Types.ObjectId) {
        return new Types.ObjectId(ref);
      } else if ('_id' in ref && ref._id) {
        const updatedURL = await updateURLReference(ref._id.toString(), ref, userId);
        return updatedURL?._id || new Types.ObjectId(ref._id);
      } else {
        const newURL = await createURLReference(ref, userId);
        if (!newURL) {
          Logger.error('Failed to create URL reference');
          Logger.error(JSON.stringify(ref));
          throw new Error('Failed to create URL reference');
        }
        return newURL._id;
      }
    }));
  }

  if (references.string_outputs) processedReferences.string_outputs = references.string_outputs;

  return processedReferences;
}
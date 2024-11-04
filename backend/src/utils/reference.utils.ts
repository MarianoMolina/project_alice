import { Types } from 'mongoose';
import Logger from './logger';
import { References } from '../interfaces/references.interface';
import { updateFile, storeFileReference } from './file.utils';
import { updateTaskResult, createTaskResult } from './taskResult.utils';
import { createMessage, updateMessage } from './message.utils';
import { createURLReference, updateURLReference } from './urlReference.utils';
import { createUserInteraction, updateUserInteraction } from './userInteraction.utils';
import { createEmbeddingChunk, updateEmbeddingChunk } from './embeddingChunk.utils';

export async function processReferences(references: References | undefined, userId: string): Promise<References> {
  Logger.debug('Processing references');
  Logger.debug('References: '+JSON.stringify(references));
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

  if (references.url_references && Array.isArray(references.url_references)) {
    processedReferences.url_references = await Promise.all(references.url_references.map(async (ref) => {
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

  if (references.user_interactions && Array.isArray(references.user_interactions)) {
    processedReferences.user_interactions = await Promise.all(references.user_interactions.map(async (ref) => {
      if (typeof ref === 'string' || ref instanceof Types.ObjectId) {
        return new Types.ObjectId(ref);
      } else if ('_id' in ref && ref._id) {
        const updatedUI = await updateUserInteraction(ref._id.toString(), ref, userId);
        return updatedUI?._id || new Types.ObjectId(ref._id);
      } else {
        const newUI = await createUserInteraction(ref, userId);
        if (!newUI) {
          Logger.error('Failed to create user interaction');
          Logger.error(JSON.stringify(ref));
          throw new Error('Failed to create user interaction');
        }
        return newUI._id;
      }
    }));
  }

  if (references.embeddings && Array.isArray(references.embeddings)) {
    processedReferences.embeddings = await Promise.all(references.embeddings.map(async (ref) => {
      if (typeof ref === 'string' || ref instanceof Types.ObjectId) {
        return new Types.ObjectId(ref);
      } else if ('_id' in ref && ref._id) {
        const updatedChunk = await updateEmbeddingChunk(ref._id.toString(), ref, userId);
        return updatedChunk?._id || new Types.ObjectId(ref._id);
      } else {
        const newChunk = await createEmbeddingChunk(ref, userId);
        if (!newChunk) {
          Logger.error('Failed to create embedding chunk');
          Logger.error(JSON.stringify(ref));
          throw new Error('Failed to create embedding chunk');
        }
        return newChunk._id;
      }
    }));
  }

  return processedReferences;
}
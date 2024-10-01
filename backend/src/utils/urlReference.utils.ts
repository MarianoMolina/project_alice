import { Types } from 'mongoose';
import { IURLReferenceDocument } from '../interfaces/urlReference.interface';
import URLReference from '../models/urlReference.model';
import Logger from './logger';

export async function createURLReference(
    urlReferenceData: Partial<IURLReferenceDocument>,
  userId: string
): Promise<IURLReferenceDocument | null> {
  try {
    Logger.debug('urlReferenceData received in createURLReference:', urlReferenceData);
    if ('_id' in urlReferenceData) {
      Logger.warn(`Removing _id from urlReferenceData: ${urlReferenceData._id}`);
      delete urlReferenceData._id;
    }

    // Set created_by and timestamps
    urlReferenceData.created_by = userId ? new Types.ObjectId(userId) : undefined;
    urlReferenceData.createdAt = new Date();
    urlReferenceData.updatedAt = new Date();

    // Create and save the task result
    const urlReference = new URLReference(urlReferenceData);
    await urlReference.save();
    return urlReference;
  } catch (error) {
    Logger.error('Error creating task result:', error);
    return null;
  }
}

export async function updateURLReference(
  urlReferenceId: string,
  urlReferenceData: Partial<IURLReferenceDocument>,
  userId: string
): Promise<IURLReferenceDocument | null> {
  try {
    Logger.info('urlReferenceData received in updateURLReference:', urlReferenceData);
    const existingurlReference = await URLReference.findById(urlReferenceId);
    if (!existingurlReference) {
      throw new Error('Task result not found');
    }

    // Compare the existing task result with the new data
    const isEqual = urlReferencesEqual(existingurlReference, urlReferenceData);
    if (isEqual) {
      // No changes detected, return existing task result
      return existingurlReference;
    }

    // Set updated_by and updatedAt
    urlReferenceData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
    urlReferenceData.updatedAt = new Date();

    // Update the task result
    const updateURLReference = await URLReference.findByIdAndUpdate(
      urlReferenceId,
      urlReferenceData,
      { new: true, runValidators: true }
    );
    return updateURLReference;
  } catch (error) {
    Logger.error('Error updating task result:', error);
    return null;
  }
}

export function urlReferencesEqual(
  tr1: IURLReferenceDocument,
  tr2: Partial<IURLReferenceDocument>
): boolean {
  const keys: (keyof IURLReferenceDocument)[] = [
    'title',
    'url',
    'content',
    'metadata',
    'created_by',
    'updated_by',
  ];
  for (const key of keys) {
    if (JSON.stringify(tr1[key]) !== JSON.stringify(tr2[key])) {
      return false;
    }
  }
  return true;
}
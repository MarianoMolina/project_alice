import { Types } from 'mongoose';
import { IEntityReferenceDocument } from '../interfaces/entityReference.interface';
import EntityReference from '../models/entityReference.model';
import Logger from './logger';
import { processEmbeddings } from './embeddingChunk.utils';

export async function createEntityReference(
  entityReferenceData: Partial<IEntityReferenceDocument>,
  userId: string
): Promise<IEntityReferenceDocument | null> {
  try {
    Logger.debug('entityReferenceData received in createEntityReference:', entityReferenceData);
    if ('_id' in entityReferenceData) {
      Logger.warn(`Removing _id from entityReferenceData: ${entityReferenceData._id}`);
      delete entityReferenceData._id;
    }

    // Initialize arrays if they're undefined
    entityReferenceData.images = entityReferenceData.images || [];
    entityReferenceData.categories = entityReferenceData.categories || [];
    entityReferenceData.connections = entityReferenceData.connections || [];

    // Set created_by and timestamps
    entityReferenceData.created_by = userId ? new Types.ObjectId(userId) : undefined;
    entityReferenceData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
    entityReferenceData.createdAt = new Date();
    entityReferenceData.updatedAt = new Date();

    if (entityReferenceData.embedding) {
      entityReferenceData.embedding = await processEmbeddings(entityReferenceData, userId);
    }

    const entityReference = new EntityReference(entityReferenceData);
    await entityReference.save();
    return await EntityReference.findById(entityReference._id);
  } catch (error) {
    Logger.error('Error creating Entity Reference:', error);
    return null;
  }
}

export async function updateEntityReference(
  entityReferenceId: string,
  entityReferenceData: Partial<IEntityReferenceDocument>,
  userId: string
): Promise<IEntityReferenceDocument | null> {
  try {
    Logger.debug('entityReferenceData received in updateEntityReference:', entityReferenceData);
    const existingEntityReference = await EntityReference.findById(entityReferenceId);
    if (!existingEntityReference) {
      throw new Error('Entity reference not found');
    }

    if (entityReferenceData.embedding) {
      entityReferenceData.embedding = await processEmbeddings(entityReferenceData, userId);
    }

    // Compare the existing entity reference with the new data
    const isEqual = entityReferencesEqual(existingEntityReference, entityReferenceData);
    if (isEqual) {
      return existingEntityReference;
    }

    // Set updated_by and updatedAt
    entityReferenceData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
    entityReferenceData.updatedAt = new Date();

    const updatedEntityReference = await EntityReference.findByIdAndUpdate(
      entityReferenceId,
      entityReferenceData,
      { new: true, runValidators: true }
    );
    return updatedEntityReference;
  } catch (error) {
    Logger.error('Error updating entity reference:', error);
    return null;
  }
}

export function entityReferencesEqual(
  er1: IEntityReferenceDocument,
  er2: Partial<IEntityReferenceDocument>
): boolean {
  const keys: (keyof IEntityReferenceDocument)[] = [
    'source_id',
    'name',
    'description',
    'content',
    'url',
    'images',
    'categories',
    'source',
    'connections',
    'metadata',
    'created_by',
    'updated_by',
    'embedding'
  ];
  
  for (const key of keys) {
    if (JSON.stringify(er1[key]) !== JSON.stringify(er2[key])) {
      return false;
    }
  }
  return true;
}
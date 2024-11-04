import { Types } from 'mongoose';
import { Embeddable, IEmbeddingChunkDocument } from '../interfaces/embeddingChunk.interface';
import EmbeddingChunk from '../models/embeddingChunk.model';
import Logger from './logger';

export async function createEmbeddingChunk(
    embeddingChunkData: Partial<IEmbeddingChunkDocument>,
    userId: string
): Promise<IEmbeddingChunkDocument | null> {
    try {
        Logger.debug('embeddingChunkData received in createEmbeddingChunk:', embeddingChunkData);

        if ('_id' in embeddingChunkData) {
            Logger.warn(`Removing _id from embeddingChunkData: ${embeddingChunkData._id}`);
            delete embeddingChunkData._id;
        }

        // Set created_by and timestamps
        embeddingChunkData.created_by = userId ? new Types.ObjectId(userId) : undefined;
        embeddingChunkData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        embeddingChunkData.createdAt = new Date();
        embeddingChunkData.updatedAt = new Date();

        // Create and save the embedding chunk
        const embeddingChunk = new EmbeddingChunk(embeddingChunkData);
        await embeddingChunk.save();

        return await EmbeddingChunk.findById(embeddingChunk._id);
    } catch (error) {
        Logger.error('Error creating embedding chunk:', error);
        return null;
    }
}

export async function updateEmbeddingChunk(
    embeddingChunkId: string,
    embeddingChunkData: Partial<IEmbeddingChunkDocument>,
    userId: string
): Promise<IEmbeddingChunkDocument | null> {
    try {
        Logger.info('embeddingChunkData received in updateEmbeddingChunk:', embeddingChunkData);

        const existingEmbeddingChunk = await EmbeddingChunk.findById(embeddingChunkId);
        if (!existingEmbeddingChunk) {
            throw new Error('Embedding chunk not found');
        }

        // Compare the existing embedding chunk with the new data
        const isEqual = embeddingChunksEqual(existingEmbeddingChunk, embeddingChunkData);
        if (isEqual) {
            // No changes detected, return existing embedding chunk
            return existingEmbeddingChunk;
        }

        // Set updated_by and updatedAt
        embeddingChunkData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        embeddingChunkData.updatedAt = new Date();

        // Update the embedding chunk
        const updatedEmbeddingChunk = await EmbeddingChunk.findByIdAndUpdate(
            embeddingChunkId,
            embeddingChunkData,
            { new: true, runValidators: true }
        );

        return updatedEmbeddingChunk;
    } catch (error) {
        Logger.error('Error updating embedding chunk:', error);
        return null;
    }
}

export function embeddingChunksEqual(
    chunk1: IEmbeddingChunkDocument,
    chunk2: Partial<IEmbeddingChunkDocument>
): boolean {
    const keys: (keyof IEmbeddingChunkDocument)[] = [
        'vector',
        'text_content',
        'index',
        'creation_metadata',
        'created_by',
        'updated_by'
    ];

    for (const key of keys) {
        // Special handling for vector array comparison
        if (key === 'vector' && chunk2.vector) {
            if (!arraysEqual(chunk1.vector, chunk2.vector)) {
                return false;
            }
            continue;
        }

        // Special handling for creation_metadata object comparison
        if (key === 'creation_metadata' && chunk2.creation_metadata) {
            if (!objectsEqual(chunk1.creation_metadata, chunk2.creation_metadata)) {
                return false;
            }
            continue;
        }

        if (JSON.stringify(chunk1[key]) !== JSON.stringify(chunk2[key])) {
            return false;
        }
    }
    return true;
}

// Helper function to compare arrays (specifically for vectors)
function arraysEqual(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((value, index) => value === arr2[index]);
}

// Helper function to compare objects (specifically for creation_metadata)
function objectsEqual(obj1: Record<string, any>, obj2: Record<string, any>): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every(key => 
        obj2.hasOwnProperty(key) && 
        JSON.stringify(obj1[key]) === JSON.stringify(obj2[key])
    );
}

export async function processEmbeddings(
  embeddable: Partial<Embeddable>,
  userId: string
): Promise<Types.ObjectId[]> {
  Logger.debug('Processing embeddings');
  
  if (!embeddable.embedding || !Array.isArray(embeddable.embedding)) {
    return [];
  }

  return await Promise.all(embeddable.embedding.map(async (embedding) => {
    if (typeof embedding === 'string' || embedding instanceof Types.ObjectId) {
      return new Types.ObjectId(embedding);
    } else if ('_id' in embedding && embedding._id) {
      const updatedEmbedding = await updateEmbeddingChunk(
        embedding._id.toString(),
        embedding as Partial<IEmbeddingChunkDocument>,
        userId
      );
      return updatedEmbedding?._id || new Types.ObjectId(embedding._id);
    } else {
      const newEmbedding = await createEmbeddingChunk(
        embedding as Partial<IEmbeddingChunkDocument>,
        userId
      );
      if (!newEmbedding) {
        Logger.error('Failed to create embedding chunk');
        Logger.error(JSON.stringify(embedding));
        throw new Error('Failed to create embedding chunk');
      }
      return newEmbedding._id;
    }
  }));
}

// Helper function to compare embeddings arrays for equality checks
export function compareEmbeddings(
  embeddings1: (Types.ObjectId | IEmbeddingChunkDocument)[] | undefined,
  embeddings2: (Types.ObjectId | IEmbeddingChunkDocument)[] | undefined
): boolean {
  if (!embeddings1 && !embeddings2) return true;
  if (!embeddings1 || !embeddings2) return false;
  if (embeddings1.length !== embeddings2.length) return false;

  return embeddings1.every((item, index) => {
    const id1 = item instanceof Types.ObjectId ? item : item._id;
    const id2 = embeddings2[index] instanceof Types.ObjectId 
      ? embeddings2[index] 
      : (embeddings2[index] as IEmbeddingChunkDocument)._id;
    
    return id1.equals(id2);
  });
}
import { Types } from 'mongoose';
import { IEmbeddingChunkDocument } from '../interfaces/embeddingChunk.interface';
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
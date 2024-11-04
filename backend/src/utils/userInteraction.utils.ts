import { Types } from 'mongoose';
import { IUserInteractionDocument } from '../interfaces/userInteraction.interface';
import UserInteraction from '../models/userInteraction.model';
import Logger from './logger';
import { processEmbeddings } from './embeddingChunk.utils';

export async function createUserInteraction(
    userInteractionData: Partial<IUserInteractionDocument>,
    userId: string
): Promise<IUserInteractionDocument | null> {
    try {
        Logger.debug('userInteractionData received in createUserInteraction:', userInteractionData);
        if ('_id' in userInteractionData) {
            Logger.warn(`Removing _id from userInteractionData: ${userInteractionData._id}`);
            delete userInteractionData._id;
        }

        // Set created_by and timestamps
        userInteractionData.created_by = userId ? new Types.ObjectId(userId) : undefined;
        userInteractionData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        userInteractionData.createdAt = new Date();
        userInteractionData.updatedAt = new Date();

        if (userInteractionData.embedding) {
            userInteractionData.embedding = await processEmbeddings(userInteractionData, userId);
        }

        // Create and save the task result
        const userInteraction = new UserInteraction(userInteractionData);
        await userInteraction.save();
        return await UserInteraction.findById(userInteraction._id);
    } catch (error) {
        Logger.error('Error creating task result:', error);
        return null;
    }
}

export async function updateUserInteraction(
    userInteractionId: string,
    userInteractionData: Partial<IUserInteractionDocument>,
    userId: string
): Promise<IUserInteractionDocument | null> {
    try {
        Logger.info('userInteractionData received in updateUserInteraction:', userInteractionData);
        const existingUserInteraction = await UserInteraction.findById(userInteractionId);
        if (!existingUserInteraction) {
            throw new Error('Task result not found');
        }
        if (userInteractionData.embedding) {
            userInteractionData.embedding = await processEmbeddings(userInteractionData, userId);
        }

        // Compare the existing task result with the new data
        const isEqual = userInteractionsEqual(existingUserInteraction, userInteractionData);
        if (isEqual) {
            // No changes detected, return existing task result
            return existingUserInteraction;
        }

        // Set updated_by and updatedAt
        userInteractionData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        userInteractionData.updatedAt = new Date();

        // Update the task result
        const updateUserInteraction = await UserInteraction.findByIdAndUpdate(
            userInteractionId,
            userInteractionData,
            { new: true, runValidators: true }
        );
        return updateUserInteraction;
    } catch (error) {
        Logger.error('Error updating task result:', error);
        return null;
    }
}

export function userInteractionsEqual(
    tr1: IUserInteractionDocument,
    tr2: Partial<IUserInteractionDocument>
): boolean {
    const keys: (keyof IUserInteractionDocument)[] = [
        'user_checkpoint_id',
        'task_response_id',
        'user_response',
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
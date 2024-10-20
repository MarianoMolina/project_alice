import { Types } from 'mongoose';
import { IUserCheckpointDocument } from '../interfaces/userCheckpoint.interface';
import UserCheckpoint from '../models/userCheckpoint.model';
import Logger from './logger';

export async function createUserCheckpoint(
    userCheckpointData: Partial<IUserCheckpointDocument>,
    userId: string
): Promise<IUserCheckpointDocument | null> {
    try {
        Logger.debug('userCheckpointData received in createUserCheckpoint:', userCheckpointData);
        if ('_id' in userCheckpointData) {
            Logger.warn(`Removing _id from userCheckpointData: ${userCheckpointData._id}`);
            delete userCheckpointData._id;
        }

        // Set created_by and timestamps
        userCheckpointData.created_by = userId ? new Types.ObjectId(userId) : undefined;
        userCheckpointData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        userCheckpointData.createdAt = new Date();
        userCheckpointData.updatedAt = new Date();

        // Create and save the task result
        const userCheckpoint = new UserCheckpoint(userCheckpointData);
        await userCheckpoint.save();
        return await UserCheckpoint.findById(userCheckpoint._id);
    } catch (error) {
        Logger.error('Error creating task result:', error);
        return null;
    }
}

export async function updateUserCheckpoint(
    userCheckpointId: string,
    userCheckpointData: Partial<IUserCheckpointDocument>,
    userId: string
): Promise<IUserCheckpointDocument | null> {
    try {
        Logger.info('userCheckpointData received in updateUserCheckpoint:', userCheckpointData);
        const existingUserCheckpoint = await UserCheckpoint.findById(userCheckpointId);
        if (!existingUserCheckpoint) {
            throw new Error('Task result not found');
        }

        // Compare the existing task result with the new data
        const isEqual = userCheckpointsEqual(existingUserCheckpoint, userCheckpointData);
        if (isEqual) {
            // No changes detected, return existing task result
            return existingUserCheckpoint;
        }

        // Set updated_by and updatedAt
        userCheckpointData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        userCheckpointData.updatedAt = new Date();

        // Update the task result
        const updateUserCheckpoint = await UserCheckpoint.findByIdAndUpdate(
            userCheckpointId,
            userCheckpointData,
            { new: true, runValidators: true }
        );
        return updateUserCheckpoint;
    } catch (error) {
        Logger.error('Error updating task result:', error);
        return null;
    }
}

export function userCheckpointsEqual(
    tr1: IUserCheckpointDocument,
    tr2: Partial<IUserCheckpointDocument>
): boolean {
    const keys: (keyof IUserCheckpointDocument)[] = [
        'user_prompt',
        'options_obj',
        'task_next_obj',
        'request_feedback',
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
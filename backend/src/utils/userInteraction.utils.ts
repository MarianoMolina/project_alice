import { Types } from 'mongoose';
import { InteractionOwnerType, IUserInteractionDocument } from '../interfaces/userInteraction.interface';
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

        // Validate owner structure based on type
        if (userInteractionData.owner) {
            validateOwnerStructure(userInteractionData.owner);
        }

        // Set created_by and timestamps
        userInteractionData.created_by = userId ? new Types.ObjectId(userId) : undefined;
        userInteractionData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        userInteractionData.createdAt = new Date();
        userInteractionData.updatedAt = new Date();

        if (userInteractionData.embedding) {
            userInteractionData.embedding = await processEmbeddings(userInteractionData, userId);
        }

        // Create and save the user interaction
        const userInteraction = new UserInteraction(userInteractionData);
        await userInteraction.save();
        return await UserInteraction.findById(userInteraction._id);
    } catch (error) {
        Logger.error('Error creating user interaction:', error);
        return null;
    }
}

export async function updateUserInteraction(
    userInteractionId: string,
    userInteractionData: Partial<IUserInteractionDocument>,
    userId: string
): Promise<IUserInteractionDocument | null> {
    try {
        Logger.debug('userInteractionData received in updateUserInteraction:', userInteractionData);
        
        const existingUserInteraction = await UserInteraction.findById(userInteractionId);
        if (!existingUserInteraction) {
            throw new Error('User interaction not found');
        }

        // Validate owner structure if it's being updated
        if (userInteractionData.owner) {
            validateOwnerStructure(userInteractionData.owner);
        }

        if (userInteractionData.embedding) {
            userInteractionData.embedding = await processEmbeddings(userInteractionData, userId);
        }

        // Compare the existing user interaction with the new data
        const isEqual = userInteractionsEqual(existingUserInteraction, userInteractionData);
        if (isEqual) {
            // No changes detected, return existing user interaction
            return existingUserInteraction;
        }

        // Set updated_by and updatedAt
        userInteractionData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        userInteractionData.updatedAt = new Date();

        // Update the user interaction
        const updatedUserInteraction = await UserInteraction.findByIdAndUpdate(
            userInteractionId,
            userInteractionData,
            { new: true, runValidators: true }
        );
        return updatedUserInteraction;
    } catch (error) {
        Logger.error('Error updating user interaction:', error);
        return null;
    }
}

function validateOwnerStructure(owner: any): void {
    if (!owner || !owner.type) {
        throw new Error('Owner must have a type property');
    }

    switch (owner.type) {
        case InteractionOwnerType.TASK_RESPONSE:
            if (!owner.task_result_id) {
                throw new Error('Task response owner must have task_result_id');
            }
            break;
        case InteractionOwnerType.CHAT:
            if (!owner.chat_id || !owner.thread_id) {
                throw new Error('Chat owner must have both chat_id and thread_id');
            }
            break;
        default:
            throw new Error(`Invalid owner type: ${owner.type}`);
    }
}

export function userInteractionsEqual(
    ui1: IUserInteractionDocument,
    ui2: Partial<IUserInteractionDocument>
): boolean {
    const keys: (keyof IUserInteractionDocument)[] = [
        'user_checkpoint_id',
        'owner',
        'user_response',
        'created_by',
        'updated_by',
        'embedding'
    ];

    for (const key of keys) {
        if (key === 'owner') {
            // Special comparison for owner
            const owner1 = ui1[key];
            const owner2 = ui2[key];
            
            if (!owner1 || !owner2) return false;
            
            if (owner1.type !== owner2.type) return false;
            
            switch (owner1.type) {
                case InteractionOwnerType.TASK_RESPONSE:
                    if (String(owner1.task_result_id) !== String('task_result_id' in owner2 && owner2.task_result_id)) {
                        return false;
                    }
                    break;
                case InteractionOwnerType.CHAT:
                    if (String(owner1.chat_id) !== String('chat_id' in owner2 && owner2.chat_id) ||
                        String(owner1.thread_id) !== String('thread_id' in owner2 && owner2.thread_id)) {
                        return false;
                    }
                    break;
                default:
                    return false;
            }
        } else if (JSON.stringify(ui1[key]) !== JSON.stringify(ui2[key])) {
            return false;
        }
    }
    
    return true;
}
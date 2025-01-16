import { Types } from "mongoose";
import { IMessageDocument } from "../interfaces/message.interface";
import { createMessage, updateMessage } from "./message.utils";
import Logger from "./logger";
import { IChatThreadDocument } from "../interfaces/thread.interface";
import { ChatThread } from "../models/thread.model";

export async function processChatThread(
    messages: Types.ObjectId[] | IMessageDocument[],
    userId: string,
): Promise<Types.ObjectId[]> {
    return Promise.all(
        messages
            .filter(ref => ref !== null)
            .map(async (ref) => {
                try {
                    if (typeof ref === 'string' || ref instanceof Types.ObjectId) {
                        return new Types.ObjectId(ref);
                    } else if ('_id' in ref && ref._id) {
                        const updated = await updateMessage(ref._id.toString(), ref, userId);
                        return updated?._id || new Types.ObjectId(ref._id);
                    } else {

                        const created = await createMessage(ref, userId);
                        if (!created) {
                            Logger.error(`Failed to create Message in thread`);
                            Logger.error(JSON.stringify(ref));
                            throw new Error(`Failed to create Message in thread`);
                        }
                        return created._id;
                    }
                } catch (error) {
                    Logger.error(`Error processing Message in thread:`, error);
                    throw error;
                }
            })
    );
}

export async function createChatThread(
    threadData: Partial<IChatThreadDocument>,
    userId: string
): Promise<IChatThreadDocument | null> {
    try {
        Logger.debug('threadData received in createChatThread:', threadData);

        if ('_id' in threadData) {
            Logger.warn(`Removing _id from threadData: ${threadData._id}`);
            delete threadData._id;
        }

        if (threadData.messages) {
            threadData.messages = await processChatThread(threadData.messages, userId);
        }

        Logger.debug('Processed thread data:', JSON.stringify(threadData, null, 2));

        if (!Types.ObjectId.isValid(userId)) {
            Logger.error('Invalid userId:', userId);
            throw new Error('Invalid userId');
        }

        threadData.created_by = new Types.ObjectId(userId);
        threadData.updated_by = new Types.ObjectId(userId);
        threadData.createdAt = new Date();
        threadData.updatedAt = new Date();

        Logger.debug('Final thread data before creating ChatThread object:', JSON.stringify(threadData, null, 2));

        let thread: IChatThreadDocument;
        try {
            thread = new ChatThread(threadData);
        } catch (error) {
            Logger.error('Error creating ChatThread object:', error);
            throw error;
        }

        Logger.debug('ChatThread object created, data:', JSON.stringify(thread.toObject(), null, 2));

        const savedThread = await thread.save();
        return savedThread;
    } catch (error) {
        Logger.error('Error creating ChatThread:', error);
        throw error;
    }
}

export async function updateChatThread(
    threadId: string,
    threadData: Partial<IChatThreadDocument>,
    userId: string
): Promise<IChatThreadDocument | null> {
    try {
        Logger.debug('threadData received in updateChatThread:', threadData);

        if ('_id' !in threadData) {
            Logger.warn(`_id not present in update threadData: ${threadId}`);
        }

        if (threadData.messages) {
            threadData.messages = await processChatThread(threadData.messages, userId);
        }

        Logger.debug('Processed thread data:', JSON.stringify(threadData, null, 2));

        if (!Types.ObjectId.isValid(userId)) {
            Logger.error('Invalid userId:', userId);
            throw new Error('Invalid userId');
        }

        threadData.updated_by = new Types.ObjectId(userId);
        threadData.updatedAt = new Date();

        Logger.debug('Final thread data before updating ChatThread object:', JSON.stringify(threadData, null, 2));

        const updatedThread = await ChatThread.findOneAndUpdate(
            { _id: threadId },
            { $set: threadData },
            { new: true }
        );

        if (!updatedThread) {
            Logger.error(`Failed to update ChatThread with ID: ${threadId}`);
            throw new Error(`Failed to update ChatThread with ID: ${threadId}`);
        }

        return updatedThread;
    } catch (error) {
        Logger.error('Error updating ChatThread:', error);
        throw error;
    }
}
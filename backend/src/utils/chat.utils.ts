import { Types } from 'mongoose';
import { IAliceChatDocument } from '../interfaces/chat.interface';
import AliceChat from '../models/chat.model';
import { updateMessage, createMessage } from './message.utils';
import { getObjectId } from './utils';
import Logger from './logger';
import { IMessageDocument } from '../interfaces/message.interface';
import { createDataCluster, updateDataCluster } from './data_cluster';
import { DataCluster } from '../models/reference.model';
import { PopulationService } from './population.utils';
import { createChatThread, updateChatThread } from './thread.utils';
import { IChatThread, IChatThreadDocument } from '../interfaces/thread.interface';
import { ChatThread } from '../models/thread.model';

const popService = new PopulationService()

export async function createChat(
    chatData: Partial<IAliceChatDocument>,
    userId: string
): Promise<IAliceChatDocument | null> {
    try {
        Logger.debug('chatData received in createChat:', chatData);

        if ('_id' in chatData) {
            Logger.warn(`Removing _id from chatData: ${chatData._id}`);
            delete chatData._id;
        }

        // Handle data cluster first
        if (chatData.data_cluster) {
            if (typeof chatData.data_cluster === 'string') {
                const cluster = await DataCluster.findById(chatData.data_cluster);
                if (!cluster) {
                    throw new Error('Data cluster not found');
                }
                chatData.data_cluster = cluster;
            } else if (chatData.data_cluster instanceof Types.ObjectId) {
                const cluster = await DataCluster.findById(chatData.data_cluster);
                if (!cluster) {
                    throw new Error('Data cluster not found');
                }
                chatData.data_cluster = cluster;
            } else if ('_id' in chatData.data_cluster) {
                const updatedCluster = await updateDataCluster(
                    chatData.data_cluster._id.toString(),
                    chatData.data_cluster,
                    userId
                );
                if (!updatedCluster) {
                    throw new Error('Failed to update data cluster');
                }
                chatData.data_cluster = updatedCluster;
            } else {
                const newCluster = await createDataCluster(chatData.data_cluster, userId);
                if (!newCluster) {
                    throw new Error('Failed to create data cluster');
                }
                chatData.data_cluster = newCluster;
            }
        }

        if (chatData.threads && Array.isArray(chatData.threads) && chatData.threads.length > 0) {
            chatData.threads = await Promise.all(
                chatData.threads.map(async (thread) => {
                    if (typeof thread === 'string') {
                        return new Types.ObjectId(thread);
                    } else if (thread._id) {
                        const updatedThread = await updateChatThread(thread._id.toString(), thread as IChatThread, userId);
                        if (!updatedThread) {
                            throw new Error('Failed to update thread');
                        }
                        return updatedThread._id;
                    } else {
                        const newThread = await createChatThread(thread as IChatThread, userId);
                        if (!newThread) {
                            throw new Error('Failed to create thread');
                        }
                        return newThread._id;
                    }
                })
            );
        }

        // Set created_by and timestamps
        chatData.created_by = userId ? new Types.ObjectId(userId) : undefined;
        chatData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        chatData.createdAt = new Date();
        chatData.updatedAt = new Date();

        // Create initial chat without messages
        Logger.debug('Creating initial chat without messages');
        const chat = new AliceChat(chatData);
        await chat.save();
        Logger.debug(`Initial chat created with ID: ${chat._id}`);

        return chat;
    } catch (error) {
        Logger.error('Error creating chat:', error);
        return null;
    }
}

// Other functions remain the same but use the chatId in message processing
export async function updateChat(
    chatId: string,
    chatData: Partial<IAliceChatDocument>,
    userId: string
): Promise<IAliceChatDocument | null> {
    try {
        const originalChat = await AliceChat.findById(chatId);
        if (!originalChat) {
            throw new Error('Chat not found');
        }

        const changeHistoryData: any = {
            changed_by: userId ? new Types.ObjectId(userId) : undefined,
            timestamp: new Date(),
        };

        // Check for changes in 'alice_agent' and 'functions'
        checkAndUpdateChanges(originalChat, chatData, changeHistoryData, 'alice_agent');
        checkArrayChangesAndUpdate(originalChat, chatData, changeHistoryData, 'agent_tools');

        let threadIds: Types.ObjectId[] = [];
        if (chatData.threads && Array.isArray(chatData.threads) && chatData.threads.length > 0) {
            for (const thread of chatData.threads) {
                // If thread is a string, it's an ID
                if (typeof thread === 'string') {
                    threadIds.push(new Types.ObjectId(thread));
                } else if (thread._id) {
                    // Update existing thread
                    const updatedThread = await updateChatThread(thread._id.toString(), thread as IChatThread, userId);
                    if (!updatedThread) {
                        throw new Error('Failed to update thread');
                    }
                    threadIds.push(updatedThread._id);
                } else {
                    // Create new thread
                    const newThread = await createChatThread(thread as IChatThread, userId);
                    if (!newThread) {
                        throw new Error('Failed to create thread');
                    }
                    threadIds.push(newThread._id);
                }
            }
        }
        chatData.threads = threadIds;
        chatData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        chatData.updatedAt = new Date();

        return await AliceChat.findByIdAndUpdate(
            chatId,
            chatData,
            { new: true, runValidators: true }
        );
    } catch (error) {
        Logger.error('Error updating chat:', error);
        return null;
    }
}

export async function createMessageInChat(
    userId: string,
    chatId: string,
    messageData: Partial<IMessageDocument>,
    threadId?: string,
): Promise<IChatThreadDocument | null> {
    try {
        Logger.debug(`createMessageInChat called for chat ${chatId}`);

        let messageDoc: IMessageDocument | null;

        if (messageData._id) {
            Logger.debug(`Updating existing message with ID: ${messageData._id}`);
            messageDoc = await updateMessage(
                messageData._id.toString(),
                messageData,
                userId,
                chatId
            );
        } else {
            Logger.debug('Creating new message');
            messageDoc = await createMessage(messageData, userId, chatId);
        }

        if (!messageDoc) {
            throw new Error('Failed to process message');
        }
        let thread: IChatThread | null;
        let threadIdFinal: Types.ObjectId | null = null;
        if (threadId) {
            threadIdFinal = new Types.ObjectId(threadId);
            // Since the thread exists, I will just update it with its new message
            thread = await ChatThread.findByIdAndUpdate(
                threadId,
                {
                    $push: { 'messages': messageDoc._id },
                    $set: { updated_by: new Types.ObjectId(userId) },
                },
                { new: true }
            );
        } else {
            // Create a new thread and add the message to it
            // Add the message to the chat
            const newId = new Types.ObjectId();
            threadIdFinal = newId;
            const chatThread = new ChatThread({
                _id: newId,
                messages: [messageDoc._id],
                created_by: userId,
                updated_by: userId,
            });
            chatThread.save();
            thread = chatThread;
            // Update the chat by adding the message ID
            await AliceChat.findByIdAndUpdate(
                chatId,
                {
                    $push: { threads: chatThread._id },
                    $set: { updated_by: new Types.ObjectId(userId) }
                },
                { new: true }
            );
        }
        if (!thread) {
            throw new Error('Failed to update chat thread');
        }

        const populatedChatThread = await popService.findAndPopulate(ChatThread, threadIdFinal, userId);

        Logger.debug(`Message ${messageDoc._id} added to chat ${chatId} - ${Object.keys(populatedChatThread || {}).length}`);

        return populatedChatThread;
    } catch (error) {
        Logger.error('Error in createMessageInChat:', error);
        return null;
    } finally {
        popService.clearCache();
    }
}

function checkAndUpdateChanges(original: any, updated: any, changeHistoryData: any, field: string): void {
    if (updated[field] && getObjectId(updated[field]).toString() !== getObjectId(original[field]).toString()) {
        changeHistoryData[`previous_${field}`] = original[field];
        changeHistoryData[`updated_${field}`] = getObjectId(updated[field]);
        original[field] = getObjectId(updated[field]);
    }
};

function checkArrayChangesAndUpdate(original: any, updated: any, changeHistoryData: any, field: string): void {
    if (updated[field] && JSON.stringify(updated[field].map(getObjectId)) !== JSON.stringify(original[field].map((item: any) => getObjectId(item).toString()))) {
        changeHistoryData[`previous_${field}`] = original[field].map((item: any) => getObjectId(item));
        changeHistoryData[`updated_${field}`] = updated[field].map(getObjectId);
        original[field] = updated[field].map(getObjectId);
    }
};

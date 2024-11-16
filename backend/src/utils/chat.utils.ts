import { Types } from 'mongoose';
import { IAliceChatDocument } from '../interfaces/chat.interface';
import AliceChat from '../models/chat.model';
import { updateMessage, createMessage } from './message.utils';
import { getObjectId } from './utils';
import Logger from './logger';
import { IMessageDocument } from '../interfaces/message.interface';
import { createDataCluster, updateDataCluster } from './data_cluster';
import { DataCluster } from '../models/reference.model';

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

        // Store messages temporarily and remove from initial save
        const messages = chatData.messages;
        delete chatData.messages;

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

        // If we had messages, process them with the new chat ID
        const messageIds: Types.ObjectId[] = [];
        if (messages && Array.isArray(messages)) {
            Logger.debug(`Processing ${messages.length} messages for chat ${chat._id}`);
            for (const msg of messages) {
                try {
                    let messageDoc: IMessageDocument | null;
                    if (typeof msg === 'string' || msg instanceof Types.ObjectId) {
                        messageIds.push(new Types.ObjectId(msg));
                        continue;
                    }
                    
                    if (msg._id) {
                        messageDoc = await updateMessage(
                            msg._id.toString(), 
                            msg, 
                            userId,
                            chat._id.toString()
                        );
                    } else {
                        messageDoc = await createMessage(
                            msg, 
                            userId,
                            chat._id.toString()
                        );
                    }

                    if (!messageDoc) {
                        throw new Error('Failed to process message');
                    }
                    messageIds.push(messageDoc._id);
                } catch (error) {
                    Logger.error('Error processing message:', error);
                    throw error;
                }
            }

            // Update chat with processed message IDs
            Logger.debug('Updating chat with processed message IDs');
            return await AliceChat.findByIdAndUpdate(
                chat._id,
                { messages: messageIds },
                { new: true }
            );
        }

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

        // Handle messages
        let messageIds: Types.ObjectId[] = [];
        if (chatData.messages && Array.isArray(chatData.messages)) {
            for (const msg of chatData.messages) {
                if (msg instanceof Types.ObjectId || typeof msg === 'string') {
                    messageIds.push(new Types.ObjectId(msg));
                } else if (msg._id) {
                    const updatedMessage = await updateMessage(
                        msg._id.toString(), 
                        msg, 
                        userId,
                        chatId
                    );
                    if (updatedMessage) {
                        messageIds.push(updatedMessage._id);
                    } else {
                        throw new Error('Failed to update message');
                    }
                } else {
                    const newMessage = await createMessage(msg, userId, chatId);
                    if (newMessage) {
                        messageIds.push(newMessage._id);
                    } else {
                        throw new Error('Failed to create message');
                    }
                }
            }
        } else {
            messageIds = originalChat.messages as Types.ObjectId[];
        }

        // Rest of the update chat function remains the same...

        chatData.messages = messageIds;
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
    chatId: string,
    messageData: Partial<IMessageDocument>,
    userId: string
): Promise<IAliceChatDocument | null> {
    try {
        Logger.info(`createMessageInChat called for chat ${chatId}`);

        let messageDoc: IMessageDocument | null;

        if (messageData._id) {
            Logger.info(`Updating existing message with ID: ${messageData._id}`);
            messageDoc = await updateMessage(
                messageData._id.toString(), 
                messageData, 
                userId,
                chatId
            );
        } else {
            Logger.info('Creating new message');
            messageDoc = await createMessage(messageData, userId, chatId);
        }

        if (!messageDoc) {
            throw new Error('Failed to process message');
        }

        // Update the chat by adding the message ID
        const updatedChat = await AliceChat.findByIdAndUpdate(
            chatId,
            {
                $push: { messages: messageDoc._id },
                $set: { updated_by: new Types.ObjectId(userId) }
            },
            { new: true }
        );

        if (!updatedChat) {
            throw new Error('Chat not found or failed to update');
        }

        Logger.info(`Message ${messageDoc._id} added to chat ${chatId}`);

        return updatedChat;
    } catch (error) {
        Logger.error('Error in createMessageInChat:', error);
        return null;
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

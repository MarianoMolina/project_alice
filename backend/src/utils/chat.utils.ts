import { Types } from 'mongoose';
import { IAliceChatDocument } from '../interfaces/chat.interface';
import AliceChat from '../models/chat.model';
import { updateMessage, createMessage } from './message.utils';
import { getObjectId } from './utils';
import Message from '../models/message.model';
import Logger from './logger';
import { IMessageDocument } from '../interfaces/message.interface';

export async function createChat(
    chatData: Partial<IAliceChatDocument>,
    userId: string
): Promise<IAliceChatDocument | null> {
    try {
        const messageIds: Types.ObjectId[] = [];
        if (chatData.messages && Array.isArray(chatData.messages)) {
            for (const msg of chatData.messages) {
                const message = await createMessage(msg, userId);
                if (message) {
                    messageIds.push(message._id);
                } else {
                    throw new Error('Failed to create message');
                }
            }
        }

        // Set created_by and timestamps
        chatData.created_by = userId ? new Types.ObjectId(userId) : undefined;
        chatData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        chatData.createdAt = new Date();
        chatData.updatedAt = new Date();
        chatData.messages = messageIds;

        // Create and save the chat
        const chat = new AliceChat(chatData);
        await chat.save();

        return chat;
    } catch (error) {
        console.error('Error creating chat:', error);
        return null;
    }
}

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
        checkArrayChangesAndUpdate(originalChat, chatData, changeHistoryData, 'functions');

        // Handle messages
        let messageIds: Types.ObjectId[] = [];
        if (chatData.messages && Array.isArray(chatData.messages)) {
            for (const msg of chatData.messages) {
                if (msg instanceof Types.ObjectId || typeof msg === 'string') {
                    // Existing message ID, add to list
                    messageIds.push(new Types.ObjectId(msg));
                } else if (msg._id) {
                    // Existing message, update it
                    const updatedMessage = await updateMessage(msg._id.toString(), msg, userId);
                    if (updatedMessage) {
                        messageIds.push(updatedMessage._id);
                    } else {
                        throw new Error('Failed to update message');
                    }
                } else {
                    // New message, create it
                    const newMessage = await createMessage(msg, userId);
                    if (newMessage) {
                        messageIds.push(newMessage._id);
                    } else {
                        throw new Error('Failed to create message');
                    }
                }
            }
        } else {
            // No messages provided, keep original messages
            messageIds = originalChat.messages as Types.ObjectId[];
        }

        // Update change history if there are changes
        if (Object.keys(changeHistoryData).length > 2) {
            // There are changes beyond 'changed_by' and 'timestamp'
            const updatedChangeHistory = originalChat.changeHistory || [];
            updatedChangeHistory.push(changeHistoryData);
            chatData.changeHistory = updatedChangeHistory;
        }

        // Set updated_by and updatedAt
        chatData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        chatData.updatedAt = new Date();
        chatData.messages = messageIds;

        // Update the chat
        const updatedChat = await AliceChat.findByIdAndUpdate(chatId, chatData, {
            new: true,
            runValidators: true,
        });

        return updatedChat;
    } catch (error) {
        console.error('Error updating chat:', error);
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

export async function createMessageInChat(
    chatId: string,
    messageData: Partial<IMessageDocument>,
    userId: string
): Promise<IMessageDocument | null> {
    try {
        Logger.info(`createMessageInChat called for chat ${chatId}`);

        let messageDoc: IMessageDocument | null;

        if (messageData._id) {
            // Message has an _id, call updateMessage
            Logger.info(`Updating existing message with ID: ${messageData._id}`);
            messageDoc = await updateMessage(messageData._id.toString(), messageData, userId);
            if (!messageDoc) {
                throw new Error('Failed to update message');
            }
        } else {
            // No _id, create new message
            Logger.info('Creating new message');
            messageDoc = await createMessage(messageData, userId);
            if (!messageDoc) {
                throw new Error('Failed to create message');
            }
        }

        // Ensure messageDoc._id is valid
        if (!messageDoc._id) {
            throw new Error('Message ID is null or undefined after creation');
        }

        // Update the chat by adding the message ID and updating updated_by
        const updatedChat = await AliceChat.findByIdAndUpdate(
            chatId,
            {
                $push: { messages: messageDoc._id },
                $set: { updated_by: new Types.ObjectId(userId) },
            },
            { new: true, runValidators: true }
        );

        if (!updatedChat) {
            throw new Error('Chat not found or failed to update');
        }

        Logger.info(`Message ${messageDoc._id} added to chat ${chatId}`);

        return messageDoc;
    } catch (error) {
        Logger.error('Error in createMessageInChat:', error);
        return null;
    }
}
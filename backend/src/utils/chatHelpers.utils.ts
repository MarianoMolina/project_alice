import { Types } from 'mongoose';
import AliceChat from '../models/chat.model';
import TaskResult from '../models/taskResult.model';
import { IAliceChatDocument, IMessage, IMessageDocument } from '../interfaces/chat.interface';
import { getObjectId, ObjectWithId } from './utils';
import logger from './logger';
import { FileContentReference, FileType } from '../interfaces/file.interface';
import { storeFile, updateFile } from './file.utils';

const ContentType = {
    ...FileType,
    TASK_RESULT: "task_result" as const,
    MULTIPLE: "multiple" as const
};

export type ContentType = typeof ContentType[keyof typeof ContentType];

export const chatHelpers = {
    async create_chat(chat: Partial<IAliceChatDocument>, userId?: string): Promise<IAliceChatDocument | null> {
        try {
            const messages = chat.messages?.map(msg => ({
                ...msg,
                _id: new Types.ObjectId(),
                created_by: userId ? new Types.ObjectId(userId) : undefined,
            }));
            const newChat = new AliceChat({
                ...chat,
                messages: messages || [],
                created_by: userId ? new Types.ObjectId(userId) : undefined,
                updated_by: userId ? new Types.ObjectId(userId) : undefined,
            });
            return await newChat.save();
        } catch (error) {
            console.error('Error creating chat:', error);
            return null;
        }
    },

    async edit_chat(chatId: string, chat: Partial<IAliceChatDocument>, userId?: string): Promise<IAliceChatDocument | null> {
        try {
            const originalChat = await AliceChat.findById(chatId);
            if (!originalChat) {
                throw new Error('Chat not found');
            }
            const newChatData = { ...chat, updated_by: userId ? new Types.ObjectId(userId) : undefined };
            const changeHistoryData: any = { changed_by: userId ? new Types.ObjectId(userId) : undefined };
            chatHelpers.checkAndUpdateChanges(originalChat, newChatData, changeHistoryData, 'alice_agent');
            chatHelpers.checkArrayChangesAndUpdate(originalChat, newChatData, changeHistoryData, 'functions');

            let final_messages = [];
            if (newChatData.messages && Array.isArray(newChatData.messages)) {
                for (const message of newChatData.messages) {
                    const existingMessageIndex = originalChat.messages.findIndex(msg => msg._id.toString() === message._id.toString());
                    if (existingMessageIndex > -1) {
                        if (!chatHelpers.messagesEqual(originalChat.messages[existingMessageIndex], message)) {
                            const msg = await chatHelpers.editMessageInChat(chatId, message._id.toString(), message, userId);
                            if (msg) final_messages.push(msg);
                        }
                    } else {
                        const msg = await chatHelpers.createMessageInChat(chatId, message, userId);
                        if (msg) final_messages.push(msg);
                    }
                }
            }
            
            if (Object.keys(changeHistoryData).length > 1) {
                if (!newChatData.changeHistory) {
                    newChatData.changeHistory = [];
                }
                newChatData.changeHistory.push(changeHistoryData);
            }
            const updatedChat = await AliceChat.findByIdAndUpdate(
                chatId,
                {
                    ...newChatData,
                    messages: final_messages,
                    updated_by: userId ? new Types.ObjectId(userId) : undefined,
                },
                { new: true, runValidators: true }
            );
            return updatedChat;
        } catch (error) {
            console.error('Error editing chat:', error);
            return null;
        }
    },

    async remove_chat(chatId: string): Promise<null> {
        try {
            await AliceChat.findByIdAndDelete(chatId);
            return null;
        } catch (error) {
            console.error('Error removing chat:', error);
            return null;
        }
    },

    async createMessageInChat(chatId: string, message: Partial<IMessage>, userId?: string): Promise<IMessage | null> {
        try {
            logger.info(`Creating message in chat ${chatId}`, { chatId, userId });
            logger.debug('Message object received', { message });

            const newMessage: Partial<IMessageDocument> = {
                ...message,
                _id: new Types.ObjectId(),
                created_by: userId ? new Types.ObjectId(userId) : undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            if (newMessage.references && Array.isArray(newMessage.references)) {
                newMessage.references = await chatHelpers.handleReferences(newMessage.references, userId);
            }

            if (newMessage.task_responses && Array.isArray(newMessage.task_responses)) {
                newMessage.task_responses = await chatHelpers.handleTaskResponses(newMessage.task_responses);
            }

            newMessage.type = chatHelpers.determineMessageType(newMessage);

            const updatedChat = await AliceChat.findByIdAndUpdate(
                chatId,
                {
                    $push: { messages: newMessage },
                    $set: { updated_by: userId ? new Types.ObjectId(userId) : undefined },
                },
                { new: true, runValidators: true }
            );

            if (!updatedChat) {
                logger.error(`Chat not found: ${chatId}`);
                throw new Error('Chat not found');
            }

            const createdMessage = updatedChat.messages[updatedChat.messages.length - 1];
            logger.debug('Message created successfully', { 
                chatId, 
                messageId: createdMessage._id,
                type: createdMessage.type
            });

            return createdMessage;
        } catch (error) {
            logger.error('Error creating message in chat:', error);
            return null;
        }
    },

    async editMessageInChat(chatId: string, msgId: string, message: Partial<IMessage>, userId?: string): Promise<IMessage | null> {
        try {
            if (message.references && Array.isArray(message.references)) {
                message.references = await chatHelpers.handleReferences(message.references, userId);
            }

            if (message.task_responses && Array.isArray(message.task_responses)) {
                message.task_responses = await chatHelpers.handleTaskResponses(message.task_responses);
            }

            message.type = chatHelpers.determineMessageType(message);

            const updatedChat = await AliceChat.findOneAndUpdate(
                { _id: chatId, 'messages._id': msgId },
                {
                    $set: {
                        'messages.$': { ...message, updated_by: userId ? new Types.ObjectId(userId) : undefined },
                        updated_by: userId ? new Types.ObjectId(userId) : undefined,
                    },
                },
                { new: true, runValidators: true }
            );

            if (!updatedChat) {
                throw new Error('Chat or message not found');
            }

            return updatedChat.messages.find(msg => msg._id.toString() === msgId) || null;
        } catch (error) {
            console.error('Error editing message in chat:', error);
            return null;
        }
    },

    async remove_message_in_chat(chatId: string, msgId: string, userId?: string): Promise<null> {
        try {
            await AliceChat.findByIdAndUpdate(
                chatId,
                {
                    $pull: { messages: { _id: msgId } },
                    $set: { updated_by: userId ? new Types.ObjectId(userId) : undefined },
                }
            );
            return null;
        } catch (error) {
            console.error('Error removing message from chat:', error);
            return null;
        }
    },

    async addTaskResultToChat(chatId: string, taskResultId: string, userId?: string): Promise<IMessage | null> {
        try {
            const taskResult = await TaskResult.findById(taskResultId);
            const chat = await AliceChat.findById(chatId);
            
            if (!taskResult) {
                throw new Error('Task result not found');
            }
            if (!chat) {
                throw new Error('Chat not found');
            }

            let messageToRemoveId: Types.ObjectId | null = null;
            chat.messages.forEach((message) => {
                if (message.task_responses &&
                    message.task_responses.length === 1 &&
                    message.task_responses[0].toString() === taskResultId) {
                    messageToRemoveId = message._id;
                }
            });
        
            if (messageToRemoveId) {
                await AliceChat.findByIdAndUpdate(chatId, {
                    $pull: { messages: { _id: messageToRemoveId } }
                });
            }

            const newMessage: Partial<IMessage> = {
                role: 'assistant',
                content: JSON.stringify(taskResult.task_outputs),
                generated_by: 'tool',
                type: ContentType.TASK_RESULT,
                task_responses: [new Types.ObjectId(taskResultId)],
                step: taskResult.task_name,
                assistant_name: 'Task Executor',
                context: null,
                tool_calls: [],
                request_type: null,
                created_by: userId ? new Types.ObjectId(userId) : undefined,
            };

            return await this.createMessageInChat(chatId, newMessage, userId);
        } catch (error) {
            console.error('Error adding task result to chat:', error);
            return null;
        }
    },

    async handleReferences(references: any[], userId?: string): Promise<Types.ObjectId[]> {
        logger.info('Handling references', { count: references.length });
        const processedReferences: Types.ObjectId[] = [];
        for (const ref of references) {
            if (typeof ref === 'string') {
                processedReferences.push(new Types.ObjectId(ref));
            } else if (typeof ref === 'object' && ref !== null) {
                if ('_id' in ref && ref._id) {
                    if (userId) {
                        if ('content' in ref) {
                            const updatedRef = await updateFile(ref as FileContentReference, userId);
                            processedReferences.push(this.ensureObjectId(updatedRef._id));
                        } else {
                            logger.warn('Attempted to update file reference without content');
                            processedReferences.push(this.ensureObjectId(ref._id));
                        }
                    } else {
                        logger.warn('Attempted to update file reference without userId');
                        processedReferences.push(this.ensureObjectId(ref._id));
                    }
                } else {
                    if (userId) {
                        const newRef = await storeFile(ref as FileContentReference, userId);
                        processedReferences.push(this.ensureObjectId(newRef._id));
                    } else {
                        logger.warn('Attempted to create file reference without userId');
                    }
                }
            }
        }
        return processedReferences;
    },

    ensureObjectId(id: any): Types.ObjectId {
        if (id instanceof Types.ObjectId) {
            return id;
        }
        if (typeof id === 'string') {
            return new Types.ObjectId(id);
        }
        if (typeof id === 'object' && id !== null && '_id' in id) {
            return this.ensureObjectId(id._id);
        }
        throw new Error(`Invalid id: ${id}`);
    },

    async handleTaskResponses(taskResponses: any[]): Promise<Types.ObjectId[]> {
        return taskResponses.map(tr => new Types.ObjectId(tr));
    },

    determineMessageType(message: Partial<IMessage>): ContentType {
        if (message.task_responses && message.task_responses.length > 0) {
            return ContentType.TASK_RESULT;
        }
        if (message.references && message.references.length > 0) {
            if (message.references.length === 1) {
                return ContentType.FILE;
            }
            return ContentType.MULTIPLE;
        }
        return ContentType.TEXT;
    },

    checkAndUpdateChanges(original: any, updated: any, changeHistoryData: any, field: string): void {
        if (updated[field] && getObjectId(updated[field]).toString() !== getObjectId(original[field]).toString()) {
            changeHistoryData[`previous_${field}`] = original[field];
            changeHistoryData[`updated_${field}`] = getObjectId(updated[field]);
            original[field] = getObjectId(updated[field]);
        }
    },

    checkArrayChangesAndUpdate(original: any, updated: any, changeHistoryData: any, field: string): void {
        if (updated[field] && JSON.stringify(updated[field].map(getObjectId)) !== JSON.stringify(original[field].map((item: ObjectWithId) => getObjectId(item).toString()))) {
            changeHistoryData[`previous_${field}`] = original[field].map((item: ObjectWithId) => getObjectId(item));
            changeHistoryData[`updated_${field}`] = updated[field].map(getObjectId);
            original[field] = updated[field].map(getObjectId);
        }
    },

    messagesEqual(msg1: IMessage, msg2: IMessage): boolean {
        const keys: (keyof IMessage)[] = ['content', 'role', 'generated_by', 'step', 'assistant_name', 'context', 'type', 'request_type'];
        return keys.every(key => {
            const hasKey1 = key in msg1;
            const hasKey2 = key in msg2;
            if (hasKey1 !== hasKey2) {
                return false;
            }
            if (!hasKey1 && !hasKey2) {
                return true;
            }
            if (key === 'context') {
                return JSON.stringify(msg1[key]) === JSON.stringify(msg2[key]);
            }
            return msg1[key] === msg2[key];
        });
    },
};
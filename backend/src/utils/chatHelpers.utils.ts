import { Types } from 'mongoose';
import AliceChat from '../models/chat.model';
import TaskResult from '../models/taskresult.model';
import { IAliceChatDocument, IMessage, IMessageDocument } from '../interfaces/chat.interface';
import { getObjectId, ObjectWithId } from './utils';
import logger from './logger';

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
                            const msg = await chatHelpers.edit_message_in_chat(chatId, message._id.toString(), message, userId);
                            final_messages.push(msg);
                        }
                    } else {
                        const msg = await chatHelpers.create_message_in_chat(chatId, message, userId);
                        final_messages.push(msg);
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

    async remove_chat(chatId: string, userId?: string): Promise<null> {
        try {
            await AliceChat.findByIdAndDelete(chatId);
            return null;
        } catch (error) {
            console.error('Error removing chat:', error);
            return null;
        }
    },

    async create_message_in_chat(chatId: string, message: Partial<IMessage>, userId?: string): Promise<IMessage | null> {
        try {
            logger.info(`Creating message in chat ${chatId}`, { chatId, userId });
            logger.info('Message object received', { message });

            const newMessage: Partial<IMessageDocument> = {
                ...message,
                _id: new Types.ObjectId(),
                created_by: userId ? new Types.ObjectId(userId) : undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            logger.info('New message object after processing', { newMessage });

            (Object.keys(newMessage) as Array<keyof IMessageDocument>).forEach(key => {
                if (newMessage[key] === undefined) {
                    delete newMessage[key];
                    logger.info(`Deleted undefined key from newMessage: ${key}`);
                }
            });

            if (newMessage.task_responses && Array.isArray(newMessage.task_responses)) {
                logger.info('Processing task responses', { count: newMessage.task_responses.length });
                newMessage.task_responses = await chatHelpers.handleTaskResponses(newMessage.task_responses, userId);
                logger.info('Processed task responses', { taskResponses: newMessage.task_responses });
            }

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
            logger.info('Message created successfully', { 
                chatId, 
                messageId: createdMessage._id,
                hasTaskResponse: !!createdMessage.task_responses
            });

            return createdMessage;
        } catch (error) {
            logger.error('Error creating message in chat:', error);
            return null;
        }
    },

    async edit_message_in_chat(chatId: string, msgId: string, message: Partial<IMessage>, userId?: string): Promise<IMessage | null> {
        try {
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

    async add_task_result_to_chat(chatId: string, taskResultId: string, userId?: string): Promise<IMessage | null> {
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
                type: 'TaskResponse',
                task_responses: [new Types.ObjectId(taskResultId)],
                step: taskResult.task_name,
                assistant_name: 'Task Executor',
                context: null,
                tool_calls: [],
                request_type: null,
                created_by: userId ? new Types.ObjectId(userId) : undefined,
            };

            return await this.create_message_in_chat(chatId, newMessage, userId);
        } catch (error) {
            console.error('Error adding task result to chat:', error);
            return null;
        }
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
    async handleTaskResponses(taskResponses: any[], userId?: string): Promise<Types.ObjectId[]> {
        logger.info('Handling task responses', { count: taskResponses.length });
        const processedTaskResponses: Types.ObjectId[] = [];
        for (const tr of taskResponses) {
            logger.debug('Processing task response', { tr });
            if (typeof tr === 'string') {
                processedTaskResponses.push(new Types.ObjectId(tr));
                logger.debug('Processed string task response', { taskResponseId: tr });
            } else if (typeof tr === 'object' && tr !== null) {
                logger.debug('Processing object task response', { tr });
                if (tr._id && tr._id !== null) {
                    await TaskResult.findByIdAndUpdate(tr._id, {
                        ...tr,
                        updated_by: userId ? new Types.ObjectId(userId) : undefined,
                    });
                    processedTaskResponses.push(new Types.ObjectId(tr._id));
                    logger.debug('Updated existing task response', { taskResponseId: tr._id });
                } else {
                    logger.debug('Attempting to create new task response', { tr });
                    try {
                        const newTaskResult = new TaskResult({
                            ...tr,
                            _id: undefined,  // Ensure we're not passing null as _id
                            created_by: userId ? new Types.ObjectId(userId) : undefined,
                            updated_by: userId ? new Types.ObjectId(userId) : undefined,
                        });
                        const savedTaskResult = await newTaskResult.save();
                        if (savedTaskResult._id instanceof Types.ObjectId) {
                            processedTaskResponses.push(savedTaskResult._id);
                            logger.debug('Created new task response', { taskResponseId: savedTaskResult._id.toString() });
                        } else {
                            logger.error('Saved task result has invalid _id', { savedTaskResult });
                            throw new Error('Invalid _id after saving task result');
                        }
                    } catch (error) {
                        logger.error('Error creating new task response', { error, tr });
                    }
                }
            } else {
                logger.warn('Invalid task response format', { tr });
            }
        }
        logger.info('Finished processing task responses', { 
            count: processedTaskResponses.length, 
            processedTaskResponses: processedTaskResponses.map(id => id.toString()) 
        });
        return processedTaskResponses;
    }
};
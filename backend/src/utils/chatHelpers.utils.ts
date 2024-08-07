import { Types } from 'mongoose';
import AliceChat from '../models/chat.model';
import TaskResult from '../models/taskresult.model';
import { IAliceChatDocument, IMessage, IMessageDocument } from '../interfaces/chat.interface';
import { getObjectId, ObjectWithId } from './utils';

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
            const newMessage: Partial<IMessageDocument> = {
                ...message,
                _id: new Types.ObjectId(),
                created_by: userId ? new Types.ObjectId(userId) : undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            (Object.keys(newMessage) as Array<keyof IMessageDocument>).forEach(key => {
                if (newMessage[key] === undefined) {
                    delete newMessage[key];
                }
            });
            if (newMessage.task_responses && Array.isArray(newMessage.task_responses)) {
                newMessage.task_responses = await chatHelpers.handleTaskResponses(newMessage.task_responses, userId);
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
                throw new Error('Chat not found');
            }

            return updatedChat.messages[updatedChat.messages.length - 1];
        } catch (error) {
            console.error('Error creating message in chat:', error);
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
        const processedTaskResponses: Types.ObjectId[] = [];
        for (const tr of taskResponses) {
            if (typeof tr === 'string') {
                processedTaskResponses.push(new Types.ObjectId(tr));
            } else if (typeof tr === 'object' && tr !== null) {
                if (tr._id) {
                    await TaskResult.findByIdAndUpdate(tr._id, {
                        ...tr,
                        updated_by: userId ? new Types.ObjectId(userId) : undefined,
                    });
                    processedTaskResponses.push(new Types.ObjectId(tr._id));
                } else {
                    const newTaskResult = new TaskResult({
                        ...tr,
                        created_by: userId ? new Types.ObjectId(userId) : undefined,
                        updated_by: userId ? new Types.ObjectId(userId) : undefined,
                    });
                    const savedTaskResult = await newTaskResult.save();
                    processedTaskResponses.push(savedTaskResult._id as Types.ObjectId);
                }
            }
        }
        return processedTaskResponses;
    }
};
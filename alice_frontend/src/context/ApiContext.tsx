import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import {
    fetchItem as apiFetchItem,
    createItem as apiCreateItem,
    updateItem as apiUpdateItem,
    executeTask as apiExecuteTask,
    generateChatResponse as apiGenerateChatResponse,
    sendMessage as apiSendMessage,
    addTaskResponse as apiAddTaskResponse,
    purgeAndReinitializeDatabase as apiPurgeAndReinitializeDatabase,
    uploadFileContentReference as apiUploadFileContentReference,
    updateFile as apiUpdateFile,
    retrieveFile as apiRetrieveFile,
    requestFileTranscript as apiRequestFileTranscript,
    updateMessageInChat as apiUpdateMessageInChat
} from '../services/api';
import { useNotification } from './NotificationContext';
import { useCardDialog } from './CardDialogContext';
import { CollectionName, CollectionType, CollectionElementString } from '../types/CollectionTypes';
import { AliceChat, MessageType } from '../types/ChatTypes';
import { TaskResponse } from '../types/TaskResponseTypes';
import { FileReference, FileContentReference } from '../types/FileTypes';
import { useDialog } from './DialogCustomContext';

interface ApiContextType {
    fetchItem: typeof apiFetchItem;
    createItem: typeof apiCreateItem;
    updateItem: typeof apiUpdateItem;
    executeTask: typeof apiExecuteTask;
    generateChatResponse: typeof apiGenerateChatResponse;
    sendMessage: typeof apiSendMessage;
    addTaskResponse: typeof apiAddTaskResponse;
    purgeAndReinitializeDatabase: typeof apiPurgeAndReinitializeDatabase;
    uploadFileContentReference: typeof apiUploadFileContentReference;
    updateFile: typeof apiUpdateFile;
    retrieveFile: typeof apiRetrieveFile;
    requestFileTranscript: typeof apiRequestFileTranscript;
    updateMessageInChat: typeof apiUpdateMessageInChat;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = () => {
    const context = useContext(ApiContext);
    if (context === undefined) {
        throw new Error('useApi must be used within an ApiProvider');
    }
    return context;
};

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addNotification } = useNotification();
    const { selectItem } = useCardDialog();
    const { openDialog } = useDialog();

    const createItem = useCallback(async <T extends CollectionName>(
        collectionName: T,
        itemData: Partial<CollectionType[T]>
    ): Promise<CollectionType[T]> => {
        try {
            const createdItem = await apiCreateItem(collectionName, itemData);
            addNotification(
                `${collectionName} created successfully`,
                'success',
                5000,
                {
                    label: 'View',
                    onClick: () => selectItem(collectionName as CollectionElementString, createdItem._id as string)
                }
            );
            return createdItem;
        } catch (error) {
            addNotification(`Error creating ${collectionName}`, 'error');
            throw error;
        }
    }, [addNotification, selectItem]);

    const updateItem = useCallback(async <T extends CollectionName>(
        collectionName: T,
        itemId: string,
        itemData: Partial<CollectionType[T]>
    ): Promise<CollectionType[T]> => {
        try {
            const updatedItem = await apiUpdateItem(collectionName, itemId, itemData);
            addNotification(
                `${collectionName} updated successfully`,
                'success',
                5000,
                {
                    label: 'View',
                    onClick: () => selectItem(collectionName as CollectionElementString, itemId)
                }
            );
            return updatedItem;
        } catch (error) {
            addNotification(`Error updating ${collectionName}`, 'error');
            throw error;
        }
    }, [addNotification, selectItem]);

    const executeTask = useCallback(async (taskId: string, inputs: any): Promise<TaskResponse> => {
        try {
            const result = await apiExecuteTask(taskId, inputs);
            addNotification('Task executed successfully', 'success', 5000, {
                label: 'View Result',
                onClick: () => selectItem('TaskResponse', result._id as string)
            });
            return result;
        } catch (error) {
            addNotification('Error executing task', 'error');
            throw error;
        }
    }, [addNotification, selectItem]);

    const generateChatResponse = useCallback(async (chatId: string): Promise<boolean> => {
        try {
            const result = await apiGenerateChatResponse(chatId);
            addNotification('Chat response generated successfully', 'success');
            return result;
        } catch (error) {
            addNotification('Error generating chat response', 'error');
            throw error;
        }
    }, [addNotification]);

    const sendMessage = useCallback(async (chatId: string, message: MessageType): Promise<AliceChat> => {
        try {
            const result = await apiSendMessage(chatId, message);
            addNotification('Message sent successfully', 'success');
            return result;
        } catch (error) {
            addNotification('Error sending message', 'error');
            throw error;
        }
    }, [addNotification]);

    const addTaskResponse = useCallback(async (chatId: string, taskResultId: string): Promise<AliceChat> => {
        try {
            const result = await apiAddTaskResponse(chatId, taskResultId);
            addNotification('Task response added successfully', 'success', 5000, {
                label: 'View Chat',
                onClick: () => selectItem('Chat', chatId)
            });
            return result;
        } catch (error) {
            addNotification('Error adding task response', 'error');
            throw error;
        }
    }, [addNotification, selectItem]);

    const purgeAndReinitializeDatabase = useCallback(async (): Promise<void> => {
        try {
            await apiPurgeAndReinitializeDatabase();
            addNotification('Database purged and reinitialized successfully', 'success');
        } catch (error) {
            addNotification('Error purging and reinitializing database', 'error');
            throw error;
        }
    }, [addNotification]);

    const uploadFileContentReference = useCallback(async (itemData: Partial<FileContentReference>): Promise<FileReference> => {
        try {
            const result = await apiUploadFileContentReference(itemData);
            addNotification('File uploaded successfully', 'success', 5000, {
                label: 'View File',
                onClick: () => selectItem('File', result._id as string)
            });
            return result;
        } catch (error) {
            addNotification('Error uploading file', 'error');
            throw error;
        }
    }, [addNotification, selectItem]);

    const updateFile = useCallback(async (file: File, fileId?: string): Promise<FileReference> => {
        try {
            const result = await apiUpdateFile(file, fileId);
            addNotification('File updated successfully', 'success', 5000, {
                label: 'View File',
                onClick: () => selectItem('File', result._id as string)
            });
            return result;
        } catch (error) {
            addNotification('Error updating file', 'error');
            throw error;
        }
    }, [addNotification, selectItem]);

    const requestFileTranscript = useCallback(async (fileId: string, agentId?: string, chatId?: string): Promise<MessageType> => {
        try {
            console.log(`Requesting transcript for file: ${fileId}`);
            const fileData = await apiFetchItem('files', fileId) as FileReference;

            if (fileData.transcript) {
                return new Promise((resolve, reject) => {
                    openDialog({
                        title: 'Existing Transcript',
                        content: 'This file already has a transcript. Do you want to generate a new one?',
                        confirmText: 'Generate New',
                        cancelText: 'Use Existing',
                        onConfirm: async () => {
                            try {
                                const newTranscript = await apiRequestFileTranscript(fileId, agentId, chatId);
                                await apiUpdateItem('files', fileId, { transcript: newTranscript });
                                addNotification('New transcript generated successfully', 'success');
                                resolve(newTranscript);
                            } catch (error) {
                                addNotification('Error generating new transcript', 'error');
                                reject(error);
                            }
                        },
                        onCancel: () => {
                            addNotification('Using existing transcript', 'info');
                            resolve(fileData.transcript as MessageType);
                        }
                    });
                });
            } else {
                const transcript = await apiRequestFileTranscript(fileId, agentId, chatId);
                await apiUpdateItem('files', fileId, { transcript: transcript });
                addNotification('Transcript generated successfully', 'success');
                return transcript;
            }
        } catch (error) {
            addNotification('Error requesting transcript', 'error');
            throw error;
        }
    }, [addNotification, openDialog]);

    const updateMessageInChat = useCallback(async (chatId: string, message: MessageType): Promise<MessageType> => {
        try {
            const result = await apiUpdateMessageInChat(chatId, message);
            addNotification('Message updated successfully', 'success');
            return result;
        } catch (error) {
            addNotification('Error updating message', 'error');
            throw error;
        }
    }, [addNotification]);

    const value: ApiContextType = {
        fetchItem: apiFetchItem,
        createItem,
        updateItem,
        executeTask,
        generateChatResponse,
        sendMessage,
        addTaskResponse,
        purgeAndReinitializeDatabase,
        uploadFileContentReference,
        updateFile,
        retrieveFile: apiRetrieveFile,
        requestFileTranscript,
        updateMessageInChat
    };

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};
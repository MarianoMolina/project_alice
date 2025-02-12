import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import {
    fetchItem as apiFetchItem,
    createItem as apiCreateItem,
    updateItem as apiUpdateItem,
    sendMessage as apiSendMessage,
    purgeAndReinitializeDatabase as apiPurgeAndReinitializeDatabase,
    uploadFileContentReference as apiUploadFileContentReference,
    updateFile as apiUpdateFile,
    retrieveFile as apiRetrieveFile,
    updateMessageInChat as apiUpdateMessageInChat,
    deleteItem as apiDeleteItem,
    fetchLMStudioModels as apiFetchLMStudioModels,
    unloadLMStudioModel as apiUnloadLMStudioModel,
    LMStudioModel,
    fetchPopulatedItem as apiFetchPopulatedItem,
    applyApiConfigToUser as apiApplyApiConfigToUser,
    updateAdminApiKeyMap as apiUpdateAdminApiKeyMap,
    getAdminApiConfigMap as apiGetAdminApiConfigMap,
    addThreadToChat as apiAddThreadToChat,
    removeThreadFromChat as apiRemoveThreadFromChat,
} from '../services/api';
import {
    executeTask as apiExecuteTask,
    generateChatResponse as apiGenerateChatResponse,
    resumeTask as apiResumeTask,
    resumeChat as apiResumeChat,
    requestFileTranscript as apiRequestFileTranscript,
    validateChatApis as apiValidateChatApis,
    validateTaskApis as apiValidateTaskApis,
    checkWorkflowHealth as apiCheckWorkflowHealth,
    checkWorkflowUserHealth as apiCheckWorkflowUserHealth,
} from '../services/workflowApi';
import { useNotification } from './NotificationContext';
import { useDialog } from './DialogContext';
import { CollectionName, CollectionType, CollectionElementString, collectionNameToElementString, CollectionPopulatedType } from '../types/CollectionTypes';
import { AliceChat, PopulatedAliceChat } from '../types/ChatTypes';
import { MessageType, PopulatedMessage } from '../types/MessageTypes';
import { TaskResponse } from '../types/TaskResponseTypes';
import { FileReference, FileContentReference } from '../types/FileTypes';
import Logger from '../utils/Logger';
import { globalEventEmitter } from '../utils/EventEmitter';
import { UserInteraction } from '../types/UserInteractionTypes';
import { useAuth } from './AuthContext';
import { ApiName } from '../types/ApiTypes';
import { ApiConfigType, initializeApiConfigMap } from '../utils/ApiUtils';
import { AxiosError } from 'axios';
import { PopulatedChatThread } from '../types/ChatThreadTypes';

interface ApiContextType {
    fetchItem: typeof apiFetchItem;
    createItem: typeof apiCreateItem;
    updateItem: typeof apiUpdateItem;
    executeTask: typeof apiExecuteTask;
    generateChatResponse: typeof apiGenerateChatResponse;
    sendMessage: typeof apiSendMessage;
    purgeAndReinitializeDatabase: typeof apiPurgeAndReinitializeDatabase;
    uploadFileContentReference: typeof apiUploadFileContentReference;
    updateFile: typeof apiUpdateFile;
    retrieveFile: typeof apiRetrieveFile;
    requestFileTranscript: typeof apiRequestFileTranscript;
    updateMessageInChat: typeof apiUpdateMessageInChat;
    resumeTask: typeof apiResumeTask;
    resumeChat: typeof apiResumeChat;
    addThreadToChat: typeof apiAddThreadToChat;
    removeThreadFromChat: typeof apiRemoveThreadFromChat;
    fetchLMStudioModels: typeof apiFetchLMStudioModels;
    unloadLMStudioModel: typeof apiUnloadLMStudioModel;
    checkWorkflowHealth: typeof apiCheckWorkflowHealth;
    checkWorkflowUserHealth: typeof apiCheckWorkflowUserHealth;
    fetchPopulatedItem: typeof apiFetchPopulatedItem;
    validateChatApis: typeof apiValidateChatApis;
    validateTaskApis: typeof apiValidateTaskApis;
    applyApiConfigToUser: typeof apiApplyApiConfigToUser;
    updateAdminApiKeyMap: typeof apiUpdateAdminApiKeyMap;
    getAdminApiConfigMap: typeof apiGetAdminApiConfigMap;
    updateUserInteraction: (
        interactionId: string,
        itemData: Partial<UserInteraction>
    ) => Promise<UserInteraction>;
    deleteItem: <T extends CollectionName>(collectionName: T, itemId: string) => Promise<boolean>;
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
    const { selectCardItem, openDialog } = useDialog();
    const { refreshUserData, isAdmin } = useAuth();

    const emitEvent = (eventType: string, collectionName: CollectionName, item: any) => {
        globalEventEmitter.emit(`${eventType}:${collectionName}`, item);
    };

    const fetchLMStudioModels = useCallback(async () => {
        try {
            return await apiFetchLMStudioModels();
        } catch (error) {
            addNotification('Error fetching LM Studio models', 'error');
            throw error;
        }
    }, [addNotification]);

    const unloadLMStudioModel = useCallback(async (model: LMStudioModel) => {
        try {
            return await apiUnloadLMStudioModel(model);
        } catch (error) {
            addNotification('Error unloading LM Studio model', 'error');
            throw error;
        }
    }, [addNotification]);

    const checkWorkflowHealth = useCallback(async () => {
        try {
            return await apiCheckWorkflowHealth();
        } catch (error) {
            addNotification('Error checking workflow health', 'error');
            throw error;
        }
    }, [addNotification]);

    const checkWorkflowUserHealth = useCallback(async () => {
        try {
            return await apiCheckWorkflowUserHealth();
        } catch (error) {
            addNotification('Error checking workflow user health', 'error');
            throw error;
        }
    }, [addNotification]);


    const fetchItem = useCallback(async <T extends CollectionName>(
        collectionName: T,
        itemId?: string | null
    ): Promise<CollectionType[T] | CollectionType[T][]> => {
        try {
            return await apiFetchItem(collectionName, itemId);
        } catch (error) {
            addNotification(`Error fetching ${collectionName}`, 'error');
            throw error;
        }
    }, [addNotification]);

    const fetchPopulatedItem = useCallback(async <T extends CollectionName>(
        collectionName: T,
        itemId?: string | null
    ): Promise<CollectionPopulatedType[T] | CollectionPopulatedType[T][]> => {
        try {
            return await apiFetchPopulatedItem(collectionName, itemId);
        } catch (error) {
            addNotification(`Error fetching ${collectionName}`, 'error');
            throw error;
        }
    }, [addNotification]);

    const createItem = useCallback(async <T extends CollectionName>(
        collectionName: T,
        itemData: Partial<CollectionType[T]>
    ): Promise<CollectionType[T]> => {
        try {
            const createdItem = await apiCreateItem(collectionName, itemData);
            Logger.debug(`Created ${collectionName}:`, createdItem);
            addNotification(
                `${collectionName} created successfully`,
                'success',
                5000,
                {
                    label: 'View',
                    onClick: () => selectCardItem(collectionNameToElementString[collectionName] as CollectionElementString, createdItem._id as string)
                }
            );
            emitEvent('created', collectionName, createdItem);
            return createdItem;
        } catch (error) {
            addNotification(`Error creating ${collectionName}`, 'error');
            throw error;
        }
    }, [addNotification, selectCardItem]);

    const updateItem = useCallback(async <T extends CollectionName>(
        collectionName: T,
        itemId: string,
        itemData: Partial<CollectionType[T] | CollectionPopulatedType[T]>
    ): Promise<CollectionType[T]> => {
        try {
            const updatedItem = await apiUpdateItem(collectionName, itemId, itemData);
            addNotification(
                `${collectionName} updated successfully`,
                'success',
                5000,
                {
                    label: 'View',
                    onClick: () => selectCardItem(collectionNameToElementString[collectionName] as CollectionElementString, itemId)
                }
            );
            emitEvent('updated', collectionName, updatedItem);
            return updatedItem;
        } catch (error) {
            addNotification(`Error updating ${collectionName}`, 'error');
            throw error;
        }
    }, [addNotification, selectCardItem]);

    const deleteItem = useCallback(async <T extends CollectionName>(
        collectionName: T,
        itemId: string
    ): Promise<boolean> => {
        return new Promise((resolve) => {
            openDialog({
                title: 'Confirm Deletion',
                content: `Are you sure you want to delete this ${collectionNameToElementString[collectionName]}?`,
                buttons: [
                    {
                        text: 'Cancel',
                        action: () => {
                            addNotification(`Deletion of ${collectionName} cancelled`, 'info');
                            resolve(false);
                        },
                        color: 'primary',
                    },
                    {
                        text: 'Delete',
                        action: async () => {
                            try {
                                await apiDeleteItem(collectionName, itemId);
                                addNotification(`${collectionNameToElementString[collectionName]} deleted successfully`, 'success');
                                emitEvent('deleted', collectionName, { _id: itemId });
                                resolve(true);
                            } catch (error) {
                                addNotification(`Error deleting ${collectionName}`, 'error');
                                Logger.error(`Error deleting item from ${collectionName}:`, error);
                                resolve(false);
                            }
                        },
                        color: 'error',
                        variant: 'contained',
                    },
                ],
            });
        });
    }, [addNotification, openDialog]);

    const executeTask = useCallback(async (taskId: string, inputs: any): Promise<TaskResponse> => {
        try {
            const result = await apiExecuteTask(taskId, inputs);
            addNotification('Task executed successfully', 'success', 5000, {
                label: 'View Result',
                onClick: () => selectCardItem('TaskResponse', result._id as string)
            });
            emitEvent('created', 'taskresults', result);
            return result;
        } catch (error) {
            addNotification('Error executing task', 'error');
            throw error;
        }
    }, [addNotification, selectCardItem]);

    const generateChatResponse = useCallback(async (chatId: string, threadId: string): Promise<boolean> => {
        try {
            const result = await apiGenerateChatResponse(chatId, threadId);
            if (result) {
                addNotification('Chat response generated successfully', 'success');
                const updatedChat = await apiFetchPopulatedItem('chats', chatId) as PopulatedAliceChat;
                emitEvent('updated', 'chats', updatedChat);
            } else {
                addNotification('Error generating chat response', 'error');
            }
            return result;
        } catch (error) {
            addNotification('Error generating chat response', 'error');
            throw error;
        }
    }, [addNotification]);

    const sendMessage = useCallback(async (chatId: string, threadId: string, message: PopulatedMessage): Promise<PopulatedChatThread> => {
        try {
            const result = await apiSendMessage(chatId, threadId, message);
            addNotification('Message sent successfully', 'success');
            emitEvent('created', 'messages', message);
            emitEvent('updated', 'chats', result);
            return result;
        } catch (error) {
            addNotification('Error sending message', 'error');
            throw error;
        }
    }, [addNotification]);

    const addThreadToChat = useCallback(async (chatId: string, threadId: string): Promise<AliceChat> => {
        try {
            const result = await apiAddThreadToChat(chatId, threadId);
            addNotification('Thread added to chat successfully', 'success');
            emitEvent('updated', 'chats', result);
            return result;
        } catch (error) {
            addNotification('Error adding thread to chat', 'error');
            throw error;
        }
    }, [addNotification]);

    const removeThreadFromChat = useCallback(async (chatId: string, threadId: string): Promise<AliceChat> => {
        try {
            const result = await apiRemoveThreadFromChat(chatId, threadId);
            addNotification('Thread removed from chat successfully', 'success');
            emitEvent('updated', 'chats', result);
            return result;
        } catch (error) {
            addNotification('Error removing thread from chat', 'error');
            throw error;
        }
    }, [addNotification]);

    const resumeTask = useCallback(async (
        taskResponseId: string,
        additionalInputs: Record<string, any> = {}
    ): Promise<TaskResponse> => {
        try {
            const result = await apiResumeTask(taskResponseId, additionalInputs);
            addNotification('Task resumed successfully', 'success', 5000, {
                label: 'View Result',
                onClick: () => selectCardItem('TaskResponse', result._id as string)
            });
            emitEvent('updated', 'taskresults', result);
            return result;
        } catch (error) {
            if (error instanceof Error && error.message.includes('Cannot resume task')) {
                addNotification(error.message, 'error');
            } else {
                addNotification('Error resuming task', 'error');
            }
            throw error;
        }
    }, [addNotification, selectCardItem]);

    const resumeChat = useCallback(async (interaction: UserInteraction): Promise<AliceChat> => {
        try {
            const result = await apiResumeChat(interaction);
            addNotification('Chat resumed successfully', 'success', 5000, {
                label: 'View Chat',
                onClick: () => selectCardItem('Chat', result._id as string)
            });
            emitEvent('updated', 'chats', result);
            return result;
        } catch (error) {
            addNotification('Error resuming chat', 'error');
            throw error;
        }
    }, [addNotification, selectCardItem]);

    const uploadFileContentReference = useCallback(async (itemData: Partial<FileContentReference>): Promise<FileReference> => {
        try {
            const result = await apiUploadFileContentReference(itemData);
            addNotification('File uploaded successfully', 'success', 5000, {
                label: 'View File',
                onClick: () => selectCardItem('File', result._id as string)
            });
            emitEvent('created', 'files', result);
            return result;
        } catch (error) {
            addNotification('Error uploading file', 'error');
            throw error;
        }
    }, [addNotification, selectCardItem]);

    const updateFile = useCallback(async (file: File, fileId?: string): Promise<FileReference> => {
        try {
            const result = await apiUpdateFile(file, fileId);
            addNotification('File updated successfully', 'success', 5000, {
                label: 'View File',
                onClick: () => selectCardItem('File', result._id as string, result)
            });
            emitEvent('updated', 'files', result);
            return result;
        } catch (error) {
            addNotification('Error updating file', 'error');
            throw error;
        }
    }, [addNotification, selectCardItem]);

    const requestFileTranscript = useCallback(async (fileId: string, agentId?: string, chatId?: string): Promise<PopulatedMessage> => {
        try {
            Logger.debug(`Requesting transcript for file: ${fileId}`);
            const fileData = await apiFetchPopulatedItem('files', fileId) as FileReference;

            if (fileData.transcript) {
                return new Promise((resolve, reject) => {
                    openDialog({
                        title: 'Existing Transcript',
                        content: 'This file already has a transcript. Do you want to generate a new one?',
                        buttons: [
                            {
                                text: 'Use Existing',
                                action: () => {
                                    addNotification('Using existing transcript', 'info');
                                    resolve(fileData.transcript as PopulatedMessage);
                                },
                                color: 'primary',
                            },
                            {
                                text: 'Generate New',
                                action: async () => {
                                    try {
                                        const newTranscript = await apiRequestFileTranscript(fileId, agentId, chatId);
                                        await updateItem('files', fileId, { transcript: newTranscript });
                                        addNotification('New transcript generated successfully', 'success');
                                        resolve(newTranscript);
                                    } catch (error) {
                                        addNotification('Error generating new transcript', 'error');
                                        reject(error);
                                    }
                                },
                                color: 'primary',
                                variant: 'contained',
                            },
                        ],
                    });
                });
            } else {
                const transcript = await apiRequestFileTranscript(fileId, agentId, chatId);
                await updateItem('files', fileId, { transcript: transcript });
                addNotification('Transcript generated successfully', 'success');
                return transcript;
            }
        } catch (error) {
            addNotification('Error requesting transcript', 'error');
            throw error;
        }
    }, [addNotification, openDialog, updateItem]);

    const updateUserInteraction = useCallback(async (
        interactionId: string,
        itemData: Partial<UserInteraction>
    ): Promise<UserInteraction> => {
        try {
            // Use existing updateItem method
            const result = await updateItem('userinteractions', interactionId, itemData);

            // If there's a user response and a task_response_id, check if we need to resume the task
            if (result.user_response && result.owner.type === 'task_response' && result.owner.task_result_id) {
                const taskResponse = await apiFetchItem('taskresults', result.owner.task_result_id) as TaskResponse;

                if (taskResponse.status === 'pending') {
                    Logger.debug('Associated task is pending, attempting to resume with user response');
                    await resumeTask(result.owner.task_result_id);

                    // Additional notification for task resumption
                    addNotification('Associated task resumed', 'info', 5000, {
                        label: 'View Task',
                        onClick: () => selectCardItem('TaskResponse', (result.owner as any).task_result_id)
                    });
                }
            }
            if (result.user_response && result.owner.type === 'chat' && result.owner.chat_id && result.owner.thread_id) {
                Logger.debug('Associated chat is pending, attempting to resume with user response');
                await resumeChat(result);
                addNotification('Associated chat resumed', 'info', 5000, {
                    label: 'View Chat',
                    onClick: () => selectCardItem('Chat', (result.owner as any).chat_id)
                });
            }
            return result;
        } catch (error) {
            addNotification('Error updating user interaction', 'error');
            throw error;
        }
    }, [updateItem, resumeTask, addNotification, selectCardItem, resumeChat]);

    const updateMessageInChat = useCallback(async (chatId: string, message: MessageType): Promise<MessageType> => {
        try {
            const result = await apiUpdateMessageInChat(chatId, message);
            addNotification('Message updated successfully', 'success');
            emitEvent('updated', 'messages', result);
            const updatedChat = await apiFetchItem('chats', chatId) as AliceChat;
            emitEvent('updated', 'chats', updatedChat);
            return result;
        } catch (error) {
            addNotification('Error updating message', 'error');
            throw error;
        }
    }, [addNotification]);

    const purgeAndReinitializeDatabase = useCallback(async (): Promise<void> => {
        try {
            await apiPurgeAndReinitializeDatabase();
            await refreshUserData();
            addNotification('Database purged and reinitialized successfully. User updated', 'success');
            globalEventEmitter.emit('databasePurged');
        } catch (error) {
            addNotification('Error purging and reinitializing database', 'error');
            Logger.error('Error purging and reinitializing database:', error);
            throw error;
        }
    }, [addNotification, refreshUserData]);

    const applyApiConfigToUser = useCallback(async (userId: string, apiNames: ApiName[], mapName?: string): Promise<void> => {
        try {
            if (isAdmin) {
                await apiApplyApiConfigToUser(userId, apiNames, mapName);
                addNotification('API configuration applied successfully', 'success');
            } else {
                addNotification('You do not have permission to apply API configurations', 'error');
            }
        } catch (error) {
            addNotification('Error applying API configuration', 'error');
            Logger.error('Error applying API configuration:', error);
            throw error;
        }
    }, [addNotification, isAdmin]);

    const updateAdminApiKeyMap = useCallback(async (key_map: Partial<ApiConfigType>, mapName?: string): Promise<void> => {
        try {
            if (isAdmin) {
                await apiUpdateAdminApiKeyMap(key_map, mapName);
                addNotification('API key map updated successfully', 'success');
            } else {
                addNotification('You do not have permission to update the API key map', 'error');
            }
        } catch (error) {
            addNotification('Error updating API key map', 'error');
            Logger.error('Error updating API key map:', error);
            throw error;
        }
    }, [addNotification, isAdmin]);

    const getAdminApiConfigMap = useCallback(async (mapName?: string): Promise<ApiConfigType> => {
        try {
            const config = await apiGetAdminApiConfigMap(mapName);
            return config;
        } catch (error) {
            if (error instanceof AxiosError && error.response?.data?.message === 'No API configuration maps found') {
                return initializeApiConfigMap();
            }
            addNotification('Error fetching API key map', 'error');
            Logger.error('Error fetching API key map:', error);
            throw error;
        }
    }, [addNotification]);

    const value: ApiContextType = {
        fetchItem,
        createItem,
        updateItem,
        deleteItem,
        executeTask,
        generateChatResponse,
        sendMessage,
        purgeAndReinitializeDatabase,
        uploadFileContentReference,
        updateFile,
        retrieveFile: apiRetrieveFile,
        requestFileTranscript,
        resumeTask,
        updateUserInteraction,
        updateMessageInChat,
        resumeChat,
        addThreadToChat,
        removeThreadFromChat,
        fetchLMStudioModels,
        unloadLMStudioModel,
        checkWorkflowHealth,
        checkWorkflowUserHealth,
        fetchPopulatedItem,
        validateChatApis: apiValidateChatApis,
        validateTaskApis: apiValidateTaskApis,
        applyApiConfigToUser,
        updateAdminApiKeyMap,
        getAdminApiConfigMap,
    };

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};
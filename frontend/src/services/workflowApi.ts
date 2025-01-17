import { taskAxiosInstance } from './axiosInstance';
import { AliceChat, convertToAliceChat } from '../types/ChatTypes';
import { getDefaultMessageForm, PopulatedMessage } from '../types/MessageTypes';
import { TaskResponse, convertToTaskResponse } from '../types/TaskResponseTypes';
import { PopulatedFileReference } from '../types/FileTypes';
import { InteractionOwnerType, UserInteraction } from '../types/UserInteractionTypes';
import { setupWebSocketConnection } from '../utils/WebSocketUtils';
import { ChatValidationResult, TaskValidationResult } from '../utils/ApiUtils';
import Logger from '../utils/Logger';
import { fetchItem, fetchPopulatedItem } from './api';

export interface LMStudioModel {
    id: string;
    type: string;
    is_loaded: boolean;
    architecture: string;
    size: number;
}

export const resumeTask = async (
    taskResponseId: string,
    additionalInputs: Record<string, any> = {}
): Promise<TaskResponse> => {
    try {
        Logger.debug('Resuming task response:', taskResponseId, 'with inputs:', additionalInputs);

        const response = await taskAxiosInstance.post('/resume_task', {
            task_response_id: taskResponseId,
            additional_inputs: additionalInputs
        });

        // The response now contains a task_id
        const taskId: string = response.data.task_id;

        // Set up WebSocket connection to receive updates
        const updatedTaskResponse = await new Promise<TaskResponse>((resolve, reject) => {
            setupWebSocketConnection(taskId, (message: any) => {
                if (message.status === 'completed') {
                    const result = convertToTaskResponse(message.result);
                    resolve(result);
                } else if (message.status === 'failed') {
                    reject(new Error(`Task failed: ${message.error}`));
                }
            });
        });

        return updatedTaskResponse;
    } catch (error) {
        Logger.error('Error resuming task:', error);
        throw error;
    }
};

export const resumeChat = async (interaction: UserInteraction): Promise<AliceChat> => {
    try {
        // Validate that this is a chat interaction
        if (interaction.owner.type !== InteractionOwnerType.CHAT) {
            throw new Error(`Cannot resume interaction with owner type: ${interaction.owner.type}. Expected: ${InteractionOwnerType.CHAT}`);
        }
        if (!interaction.owner.id) {
            throw new Error('Chat interaction does not have an owner ID');
        }

        Logger.debug('Resuming chat with interaction:', interaction);

        const response = await taskAxiosInstance.post(`/chat_resume`, {
            interaction_id: interaction._id
        });

        // The response now contains a task_id
        const taskId: string = response.data.task_id;

        // Set up WebSocket connection to receive updates
        const updatedChat = await new Promise<AliceChat>((resolve, reject) => {
            setupWebSocketConnection(taskId, async (message: any) => {
                if (message.status === 'completed') {
                    const chatId = interaction.owner.id;
                    const updatedChatData = await fetchItem('chats', chatId) as AliceChat;
                    resolve(convertToAliceChat(updatedChatData));
                } else if (message.status === 'failed') {
                    reject(new Error(`Chat resume failed: ${message.error}`));
                }
            });
        });

        return updatedChat;
    } catch (error) {
        Logger.error('Error resuming chat:', error);
        throw error;
    }
};

export const requestFileTranscript = async (
    fileId: string,
    agentId?: string,
    chatId?: string
): Promise<PopulatedMessage> => {
    try {
        Logger.debug(`Requesting transcript for file: ${fileId}`);

        // First, check if the file already has a transcript
        const fileData = await fetchPopulatedItem('files', fileId) as PopulatedFileReference;
        if (fileData.transcript) {
            Logger.warn('File already has a transcript');
            return fileData.transcript;
        }

        if (fileData.type === 'file') {
            Logger.warn('File is not a media file');
            return fileData.transcript || getDefaultMessageForm();
        }

        // If no transcript exists, request one from the workflow
        const response = await taskAxiosInstance.post(`/file_transcript`, { file_id: fileId, agent_id: agentId, chat_id: chatId });

        // The response now contains a task_id
        const taskId: string = response.data.task_id;

        // Set up WebSocket connection to receive updates
        const transcriptMessage = await new Promise<PopulatedMessage>((resolve, reject) => {
            setupWebSocketConnection(taskId, async (message: any) => {
                if (message.status === 'completed') {
                    const updatedFileData = await fetchPopulatedItem('files', fileId) as PopulatedFileReference;
                    if (updatedFileData.transcript) {
                        resolve(updatedFileData.transcript);
                    } else {
                        reject(new Error('Transcript not found after task completion'));
                    }
                } else if (message.status === 'failed') {
                    reject(new Error(`File transcript task failed: ${message.error}`));
                }
            });
        });

        Logger.debug('Retrieved transcript:', transcriptMessage);
        return transcriptMessage;
    } catch (error) {
        Logger.error('Error requesting file transcript:', error);
        throw error;
    }
};

export const generateChatResponse = async (chatId: string, threadId: string): Promise<boolean> => {
    try {
        Logger.debug('Generating chat response for chatId:', chatId, threadId);
        const response = await taskAxiosInstance.post(`/chat_response`, { chat_id: chatId, thread_id: threadId });

        // The response now contains a task_id
        const taskId: string = response.data.task_id;

        // Set up WebSocket connection to receive updates
        const success = await new Promise<boolean>((resolve, reject) => {
            setupWebSocketConnection(taskId, (message: any) => {
                if (message.status === 'completed') {
                    resolve(true);
                } else if (message.status === 'failed') {
                    reject(new Error(`Chat response generation failed: ${message.error}`));
                }
            });
        });

        return success;
    } catch (error) {
        Logger.error('Error generating chat response:', error);
        throw error;
    }
};

export const executeTask = async (taskId: string, inputs: any): Promise<TaskResponse> => {
    try {
        // First make the task execution request and get the queue task ID
        const response = await taskAxiosInstance.post('/execute_task', { taskId, inputs });
        Logger.debug('Task execution response:', response.data);
        const queueTaskId = response.data.task_id;

        // Now that we have the queue task ID, set up WebSocket connection
        const taskResponsePromise = new Promise<TaskResponse>((resolve, reject) => {
            setupWebSocketConnection(queueTaskId, (message: any) => {
                if (message.status === 'completed') {
                    Logger.debug('Task execution completed:', message.result);
                    const result = convertToTaskResponse(message.result);
                    resolve(result);
                } else if (message.status === 'failed') {
                    reject(new Error(`Task execution failed: ${message.error}`));
                }
            });
        });

        // Wait for the WebSocket response
        return await taskResponsePromise;
    } catch (error) {
        Logger.error('Error executing task:', error);
        throw error;
    }
};

export const checkWorkflowHealth = async (): Promise<{ status: string; message: string }> => {
    try {
        Logger.debug('Checking workflow basic health status');
        const response = await taskAxiosInstance.get('/health');
        return response.data;
    } catch (error) {
        Logger.error('Error checking workflow health:', error);
        throw error;
    }
};

export const checkWorkflowUserHealth = async (): Promise<{
    status: string;
    message: string;
    api_health: string;
}> => {
    try {
        Logger.debug('Checking workflow user-level health status');
        const response = await taskAxiosInstance.get('/health/api');

        // If we received a task_id, we need to wait for the WebSocket response
        if (response.data.task_id) {
            const taskId = response.data.task_id;

            // Set up WebSocket connection to receive updates
            const healthStatus = await new Promise((resolve, reject) => {
                setupWebSocketConnection(taskId, (message: any) => {
                    if (message.status === 'completed') {
                        resolve(message.result);
                    } else if (message.status === 'failed') {
                        reject(new Error(`Health check failed: ${message.error}`));
                    }
                });
            });

            return healthStatus as any;
        }

        // If no task_id, return the direct response
        return response.data;
    } catch (error) {
        Logger.error('Error checking workflow user health:', error);
        throw error;
    }
};
interface ValidationResponse {
    task_id: string;
}

/**
 * Validates the API requirements for a specific chat
 * @param chatId The ID of the chat to validate
 * @returns Promise containing the validation results
 */
export const validateChatApis = async (chatId: string): Promise<ChatValidationResult> => {
    try {
        Logger.debug('Validating APIs for chat:', chatId);
        const response = await taskAxiosInstance.post<ValidationResponse>('/validate_chat_apis', {
            id: chatId
        });

        // Get the task ID from the response
        const taskId = response.data.task_id;

        // Set up WebSocket connection to receive validation results
        const validationResult = await new Promise<ChatValidationResult>((resolve, reject) => {
            setupWebSocketConnection(taskId, (message: any) => {
                if (message.status === 'completed') {
                    resolve(message.result as ChatValidationResult);
                } else if (message.status === 'failed') {
                    reject(new Error(`Chat API validation failed: ${message.error}`));
                }
            });
        });

        Logger.debug('Chat API validation result:', validationResult);
        return validationResult;
    } catch (error) {
        Logger.error('Error validating chat APIs:', error);
        throw error;
    }
};

/**
 * Validates the API requirements for a specific task
 * @param taskId The ID of the task to validate
 * @returns Promise containing the validation results
 */
export const validateTaskApis = async (taskId: string): Promise<TaskValidationResult> => {
    try {
        Logger.debug('Validating APIs for task:', taskId);
        const response = await taskAxiosInstance.post<ValidationResponse>('/validate_task_apis', {
            id: taskId
        });

        // Get the task ID from the response
        const queueTaskId = response.data.task_id;

        // Set up WebSocket connection to receive validation results
        const validationResult = await new Promise<TaskValidationResult>((resolve, reject) => {
            setupWebSocketConnection(queueTaskId, (message: any) => {
                if (message.status === 'completed') {
                    resolve(message.result as TaskValidationResult);
                } else if (message.status === 'failed') {
                    reject(new Error(`Task API validation failed: ${message.error}`));
                }
            });
        });

        Logger.debug('Task API validation result:', validationResult);
        return validationResult;
    } catch (error) {
        Logger.error('Error validating task APIs:', error);
        throw error;
    }
};
import { dbAxiosInstance, dbAxiosInstanceLMS, taskAxiosInstance } from './axiosInstance';
import { AliceChat, convertToAliceChat } from '../types/ChatTypes';
import { getDefaultMessageForm, MessageType } from '../types/MessageTypes';
import { TaskResponse, convertToTaskResponse } from '../types/TaskResponseTypes';
import { CollectionName, CollectionType } from '../types/CollectionTypes';
import { FileReference, FileContentReference } from '../types/FileTypes';
import { createFileContentReference } from '../utils/FileUtils';
import Logger from '../utils/Logger';
import { converters } from '../utils/Converters';
import { InteractionOwnerType, UserInteraction } from '../types/UserInteractionTypes';
import { setupWebSocketConnection } from '../utils/WebSocketUtils';

export interface LMStudioModel {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  root: string;
  parent: null;
  permission: string[];
  type: string;
  is_loaded: boolean;
}

/**
 * Fetches available models from LM Studio backend
 * @returns Promise<LMStudioModel[]> Array of available models
 */
export const fetchLMStudioModels = async (): Promise<LMStudioModel[]> => {
  try {
    Logger.debug('Fetching LM Studio models');
    const response = await dbAxiosInstanceLMS.get('/lm_studio/v1/models');

    // Handle the nested data structure
    const modelList = response.data.data;
    if (!Array.isArray(modelList)) {
      Logger.debug('Invalid response format:', response.data);
      throw new Error('Invalid response format: expected array of models in data field');
    }

    // We're getting the models directly from the response now
    const models: LMStudioModel[] = modelList.map(model => ({
      id: model.id,
      object: model.object,
      created: model.created,
      owned_by: 'local',
      root: model.id,
      parent: null,
      permission: [],
      type: model.type || 'unknown',
      is_loaded: model.is_loaded
    }));

    Logger.debug('Fetched LM Studio models:', models);
    return models;
  } catch (error) {
    Logger.error('Error fetching LM Studio models:', error);
    throw error;
  }
};
export const fetchItem = async <T extends CollectionName>(
  collectionName: T,
  itemId: string | null = null
): Promise<CollectionType[T] | CollectionType[T][]> => {
  collectionName = collectionName.toLowerCase() as T;
  Logger.debug("fetchItem", collectionName, itemId);
  try {
    const url = itemId ? `/${collectionName}/${itemId}` : `/${collectionName}`;
    const response = await dbAxiosInstance.get(url);
    const converter = converters[collectionName];
    Logger.debug("fetchItem response", response.data);
    if (Array.isArray(response.data)) {
      return response.data.map(item => converter(item)) as CollectionType[T][];
    } else {
      return converter(response.data) as CollectionType[T];
    }
  } catch (error) {
    Logger.error(`Error fetching items from ${collectionName}:`, error, itemId);
    throw error;
  }
};

export const createItem = async <T extends CollectionName>(
  collectionName: T,
  itemData: Partial<CollectionType[T]>
): Promise<CollectionType[T]> => {
  try {
    const url = `/${collectionName}`;
    Logger.debug('Creating item with data:', JSON.stringify(itemData));
    const response = await dbAxiosInstance.post(url, itemData);
    return converters[collectionName](response.data) as CollectionType[T];
  } catch (error) {
    Logger.error(`Error creating item in ${collectionName}:`, error);
    throw error;
  }
};

export const updateItem = async <T extends CollectionName>(
  collectionName: T,
  itemId: string,
  itemData: Partial<CollectionType[T]>
): Promise<CollectionType[T]> => {
  try {
    const url = `/${collectionName}/${itemId}`;
    Logger.debug("Updating item with data:", JSON.stringify(itemData), collectionName, itemId);
    const response = await dbAxiosInstance.patch(url, itemData);
    const data = converters[collectionName](response.data) as CollectionType[T];
    Logger.debug("Updated item:", data)
    return data;
  } catch (error) {
    Logger.error(`Error updating item in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteItem = async <T extends CollectionName>(
  collectionName: T,
  itemId: string
): Promise<void> => {
  try {
    const url = `/${collectionName}/${itemId}`;
    Logger.debug(`Deleting item from ${collectionName}:`, itemId);
    await dbAxiosInstance.delete(url);
    Logger.debug(`Item deleted successfully from ${collectionName}:`, itemId);
  } catch (error) {
    Logger.error(`Error deleting item from ${collectionName}:`, error);
    throw error;
  }
};



export const purgeAndReinitializeDatabase = async (): Promise<void> => {
  try {
    Logger.info('Purging and reinitializing database');
    const response = await dbAxiosInstance.post('/users/purge-and-reinitialize');
    Logger.info('Database purged and reinitialized:', response.data.message);
  } catch (error) {
    Logger.error('Error purging and reinitializing database:', error);
    throw error;
  }
};

export const uploadFileContentReference = async (
  itemData: Partial<FileContentReference>
): Promise<FileReference> => {
  try {
    const url = `/files/`;
    Logger.debug('Creating file with data:', JSON.stringify(itemData));
    const response = await dbAxiosInstance.post(url, itemData);
    return converters['files'](response.data) as FileReference;
  } catch (error) {
    Logger.error(`Error creating file:`, error);
    throw error;
  }
};

export const updateFile = async (
  file: File,
  fileId?: string
): Promise<FileReference> => {
  try {
    const url = `/files/${fileId}`;
    const fileContentReference = await createFileContentReference(file);
    Logger.debug('Updating file with data:', JSON.stringify(fileContentReference));
    const response = await dbAxiosInstance.patch(url, fileContentReference);
    return converters['files'](response.data) as FileReference;
  } catch (error) {
    Logger.error(`Error updating file:`, error);
    throw error;
  }
}

export const retrieveFile = async (fileId: string): Promise<Blob> => {
  try {
    const response = await dbAxiosInstance.get(`/files/serve/${fileId}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    Logger.error('Error retrieving file:', error);
    throw error;
  }
};


export const updateMessageInChat = async (chatId: string, updatedMessage: MessageType): Promise<MessageType> => {
  try {
    const response = await dbAxiosInstance.patch(`/chats/${chatId}/update_message`, { message: updatedMessage });
    return response.data.message;
  } catch (error) {
    Logger.error('Error updating message in chat:', error);
    throw error;
  }
};

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

export const sendMessage = async (chatId: string, message: MessageType): Promise<AliceChat> => {
  try {
    Logger.debug('Sending message to chatId:', chatId);

    // Check if the message contains file references
    if (message.references && message.references.files && message.references.files.length > 0) {
      for (const reference of message.references.files) {
        if ('_id' in reference && reference._id) {
          if ('transcript' in reference && reference.transcript) {
            Logger.warn('Reference already has a transcript:', reference);
          }
          else if (reference.type !== 'file') {
            Logger.debug('Reference is a media file:', reference);
            const transcript = await requestFileTranscript(reference._id, undefined, chatId);
            Logger.debug('Retrieved transcript:', transcript, "for reference:", reference);
          }
        }
        else {
          Logger.warn('Reference does not have an _id:', reference); // Upload this reference?
        }
      }
    }

    const response = await dbAxiosInstance.patch(`/chats/${chatId}/add_message`, { message });
    Logger.debug('Received response:', response.data);
    return convertToAliceChat(response.data.chat);
  } catch (error) {
    Logger.error('Error sending message:', error);
    throw error;
  }
};

export const requestFileTranscript = async (
  fileId: string,
  agentId?: string,
  chatId?: string
): Promise<MessageType> => {
  try {
    Logger.debug(`Requesting transcript for file: ${fileId}`);

    // First, check if the file already has a transcript
    const fileData = await fetchItem('files', fileId) as FileReference;
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
    const transcriptMessage = await new Promise<MessageType>((resolve, reject) => {
      setupWebSocketConnection(taskId, async (message: any) => {
        if (message.status === 'completed') {
          const updatedFileData = await fetchItem('files', fileId) as FileReference;
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

export const generateChatResponse = async (chatId: string): Promise<boolean> => {
  try {
    Logger.debug('Generating chat response for chatId:', chatId);
    const response = await taskAxiosInstance.post(`/chat_response`, { chat_id: chatId });

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
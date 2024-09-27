import { dbAxiosInstance, taskAxiosInstance } from './axiosInstance';
import { AliceChat, convertToAliceChat } from '../types/ChatTypes';
import { MessageType } from '../types/MessageTypes';
import { TaskResponse, convertToTaskResponse } from '../types/TaskResponseTypes';
import { CollectionName, CollectionType, converters } from '../types/CollectionTypes';
import { FileReference, FileContentReference } from '../types/FileTypes';
import { createFileContentReference } from '../utils/FileUtils';

export const fetchItem = async <T extends CollectionName>(
  collectionName: T,
  itemId: string | null = null
): Promise<CollectionType[T] | CollectionType[T][]> => {
  collectionName = collectionName.toLowerCase() as T;
  console.log("fetchItem", collectionName, itemId);
  try {
    const url = itemId ? `/${collectionName}/${itemId}` : `/${collectionName}`;
    const response = await dbAxiosInstance.get(url);
    const converter = converters[collectionName];
    console.log("fetchItem response", response.data);
    if (Array.isArray(response.data)) {
      return response.data.map(item => converter(item)) as CollectionType[T][];
    } else {
      return converter(response.data) as CollectionType[T];
    }
  } catch (error) {
    console.error(`Error fetching items from ${collectionName}:`, error, itemId);
    throw error;
  }
};

export const createItem = async <T extends CollectionName>(
  collectionName: T,
  itemData: Partial<CollectionType[T]>
): Promise<CollectionType[T]> => {
  try {
    const url = `/${collectionName}`;
    console.log('Creating item with data:', JSON.stringify(itemData));
    const response = await dbAxiosInstance.post(url, itemData);
    return converters[collectionName](response.data) as CollectionType[T];
  } catch (error) {
    console.error(`Error creating item in ${collectionName}:`, error);
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
    console.log("Updating item with data:", JSON.stringify(itemData), collectionName, itemId);
    const response = await dbAxiosInstance.patch(url, itemData);
    const data = converters[collectionName](response.data) as CollectionType[T];
    console.log("Updated item:", data)
    return data;
  } catch (error) {
    console.error(`Error updating item in ${collectionName}:`, error);
    throw error;
  }
};

export const sendMessage = async (chatId: string, message: MessageType): Promise<AliceChat> => {
  try {
    console.log('Sending message to chatId:', chatId);

    // Check if the message contains file references
    if (message.references && message.references.length > 0) {
      for (const reference of message.references) {
        if ('_id' in reference) {
          if ('transcript' in reference && reference.transcript) {
            console.log('Reference already has a transcript:', reference);
          }
          else {
            const transcript = await requestFileTranscript(reference._id, undefined, chatId);
            console.log('Retrieved transcript:', transcript, "for reference:", reference);
          }
        }
        else {
          console.log('Reference does not have an _id:', reference); // Upload this reference?
        }
      }
    }

    const response = await dbAxiosInstance.patch(`/chats/${chatId}/add_message`, { message });
    return convertToAliceChat(response.data);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const requestFileTranscript = async (fileId: string, agentId?: string, chatId?: string): Promise<MessageType> => {
  try {
    console.log(`Requesting transcript for file: ${fileId}`);

    // First, check if the file already has a transcript
    const fileData = await fetchItem('files', fileId) as FileReference;
    if (fileData.transcript) console.log('File already has a transcript');

    // If no transcript exists, request one from the workflow
    const response = await taskAxiosInstance.post(`/file_transcript/${fileId}`, { agent_id: agentId, chat_id: chatId });
    const { transcript } = response.data;
    console.log('Retrieved transcript:', transcript);
    return transcript;
  } catch (error) {
    console.error('Error requesting file transcript:', error);
    throw error;
  }
};

export const generateChatResponse = async (chatId: string): Promise<boolean> => {
  try {
    console.log('Generating chat response for chatId:', chatId);
    const response = await taskAxiosInstance.post(`/chat_response/${chatId}`);
    return response.data;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
};

export const executeTask = async (taskId: string, inputs: any): Promise<TaskResponse> => {
  try {
    const response = await taskAxiosInstance.post('/execute_task', { taskId, inputs });
    return convertToTaskResponse(response.data);
  } catch (error) {
    console.error('Error executing task:', error);
    throw error;
  }
};

export const addTaskResponse = async (chatId: string, taskResultId: string): Promise<AliceChat> => {
  try {
    console.log('Adding task response to chatId:', chatId, 'with taskResultId:', taskResultId);
    
    // Fetch the task result
    const taskResult = await fetchItem('taskresults', taskResultId) as TaskResponse;
    
    // Create a message object with the task result's output
    const message: MessageType = {
      role: 'assistant',
      content: JSON.stringify(taskResult.task_outputs),
      generated_by: 'tool',
      type: 'task_result',
      task_responses: [taskResult],
    };

    // Send the message to the chat
    return await sendMessage(chatId, message);
  } catch (error) {
    console.error('Error adding task response:', error);
    throw error;
  }
};

export const purgeAndReinitializeDatabase = async (): Promise<void> => {
  try {
    console.log('Purging and reinitializing database');
    const response = await dbAxiosInstance.post('/users/purge-and-reinitialize');
    console.log('Database purged and reinitialized:', response.data.message);
  } catch (error) {
    console.error('Error purging and reinitializing database:', error);
    throw error;
  }
};

export const uploadFileContentReference = async (
  itemData: Partial<FileContentReference>
): Promise<FileReference> => {
  try {
    const url = `/files/`;
    console.log('Creating file with data:', JSON.stringify(itemData));
    const response = await dbAxiosInstance.post(url, itemData);
    return converters['files'](response.data) as FileReference;
  } catch (error) {
    console.error(`Error creating file:`, error);
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
    console.log('Updating file with data:', JSON.stringify(fileContentReference));
    const response = await dbAxiosInstance.patch(url, fileContentReference);
    return converters['files'](response.data) as FileReference;
  } catch (error) {
    console.error(`Error updating file:`, error);
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
    console.error('Error retrieving file:', error);
    throw error;
  }
};


export const updateMessageInChat = async (chatId: string, updatedMessage: MessageType): Promise<MessageType> => {
  try {
    const response = await dbAxiosInstance.patch(`/chats/${chatId}/update_message`, { message: updatedMessage });
    return response.data.message;
  } catch (error) {
    console.error('Error updating message in chat:', error);
    throw error;
  }
};
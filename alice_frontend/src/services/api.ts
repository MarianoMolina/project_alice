import { dbAxiosInstance, taskAxiosInstance } from './axiosInstance';
import { AliceChat, convertToAliceChat } from '../types/ChatTypes';
import { TaskResponse, convertToTaskResponse } from '../types/TaskResponseTypes';
import { CollectionName, CollectionType, converters } from '../types/CollectionTypes';

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
    console.log("TRYING: ", response)
    const data = converters[collectionName](response.data) as CollectionType[T];
    console.log("Updated item:", data)
    return data;
  } catch (error) {
    console.error(`Error updating item in ${collectionName}:`, error);
    throw error;
  }
};

export const sendMessage = async (chatId: string, message: any): Promise<AliceChat> => {
  try {
    console.log('Sending message to chatId:', chatId);
    const response = await dbAxiosInstance.patch(`/chats/${chatId}/add_message`, { message });
    return convertToAliceChat(response.data);
  } catch (error) {
    console.error('Error sending message:', error);
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
    console.log('Task executed:', response.data);
    return convertToTaskResponse(response.data);
  } catch (error) {
    console.error('Error executing task:', error);
    throw error;
  }
};

export const addTaskResponse = async (chatId: string, taskResultId: string): Promise<AliceChat> => {
  try {
    console.log('Adding task response to chatId:', chatId, 'with taskResultId:', taskResultId);
    const response = await dbAxiosInstance.patch(`/chats/${chatId}/add_task_response`, { taskResultId });
    return convertToAliceChat(response.data.chat);
  } catch (error) {
    console.error('Error adding task response:', error);
    throw error;
  }
};

export const purgeAndReinitializeDatabase = async (): Promise<void> => {
  try {
    console.log('Purging and reinitializing database');
    const response = await dbAxiosInstance.post('/users/purge-and-reinitialize');
    console.log('Database purged and reinitialized:', response.data);
  } catch (error) {
    console.error('Error purging and reinitializing database:', error);
    throw error;
  }
};
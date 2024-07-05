import { dbAxiosInstance, taskAxiosInstance } from './axiosInstance';
import { AliceAgent, convertToAliceAgent } from '../utils/AgentTypes';
import { AliceChat, convertToAliceChat } from '../utils/ChatTypes';
import { AliceModel, convertToAliceModel } from '../utils/ModelTypes';
import { AliceTask, convertToAliceTask } from '../utils/TaskTypes';
import { Prompt, convertToPrompt } from '../utils/PromptTypes';
import { TaskResponse, convertToTaskResponse } from '../utils/TaskResponseTypes';
import { ParameterDefinition, convertToParameterDefinition } from '../utils/ParameterTypes';
import { User, convertToUser } from '../utils/Types';

export type CollectionName = 'agents' | 'chats' | 'models' | 'tasks' | 'prompts' | 'taskresults' | 'users' | 'parameters';

export type CollectionType = {
  agents: AliceAgent;
  chats: AliceChat;
  models: AliceModel;
  tasks: AliceTask;
  prompts: Prompt;
  taskresults: TaskResponse;
  users: User;
  parameters: ParameterDefinition;
};

const converters: { [K in CollectionName]: (data: any) => CollectionType[K] } = {
  agents: convertToAliceAgent,
  chats: convertToAliceChat,
  models: convertToAliceModel,
  tasks: convertToAliceTask,
  prompts: convertToPrompt,
  taskresults: convertToTaskResponse,
  users: convertToUser,
  parameters: convertToParameterDefinition
};

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
    console.error(`Error fetching items from ${collectionName}:`, error);
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

// The rest of the functions remain the same
export const fetchUserChats = async (): Promise<AliceChat[]> => {
  try {
    const response = await dbAxiosInstance.get(`/chats/user_auth`);
    return response.data.map(convertToAliceChat);
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};

export const fetchChatById = async (chatId: string): Promise<AliceChat> => {
  try {
    const response = await dbAxiosInstance.get(`/chats/${chatId}`);
    return convertToAliceChat(response.data);
  } catch (error) {
    console.error('Error fetching chat:', error);
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

export const generateChatResponse = async (chatId: string): Promise<any[]> => {
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
import { dbAxiosInstance, taskAxiosInstance } from './axiosInstance';

// Type definitions for responses
interface CollectionResponse {
  data: any;
}

interface SchemaResponse {
  data: any;
}

interface TaskResponse {
  data: any;
}

// Fetch all collections
export const fetchCollections = async (): Promise<any> => {
  try {
    const response: CollectionResponse = await dbAxiosInstance.get('/collections');
    return response.data;
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
};

// Fetch schema for a collection
export const fetchSchema = async (collectionName: string): Promise<any> => {
  collectionName = collectionName.toLowerCase();
  try {
    const url = `/collections/${collectionName}/schema`;
    console.log(`Fetching schema for ${collectionName} from:`, url);
    const response: SchemaResponse = await dbAxiosInstance.get(url);
    console.log(`Fetched schema for ${collectionName}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching schema for ${collectionName}:`, error);
    throw error;
  }
};

export const executeTask = async (taskId: string, inputs: any): Promise<any> => {
  try {
    const response: TaskResponse = await taskAxiosInstance.post('/execute_task', {
      taskId,
      inputs
    });
    return response.data;
  } catch (error) {
    console.error('Error executing task:', error);
    throw error;
  }
};

// Fetch an item from a collection
export const fetchItem = async (collectionName: string, itemId: string | null = null): Promise<any> => {
  collectionName = collectionName.toLowerCase();
  console.log("fetchItem", collectionName, itemId);
  try {
    const url = itemId ? `/${collectionName}/${itemId}` : `/${collectionName}`;
    const response: CollectionResponse = await dbAxiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching items from ${collectionName}:`, error);
    throw error;
  }
};

// Create a new item in a collection
export const createItem = async (collectionName: string, itemData: any): Promise<any> => {
  try {
    const url = `/${collectionName}`;
    console.log('Creating item with data:', JSON.stringify(itemData)); // Log payload
    const response: CollectionResponse = await dbAxiosInstance.post(url, itemData);
    return response.data;
  } catch (error) {
    console.error(`Error creating item in ${collectionName}:`, error);
    throw error;
  }
};

// Update an item in a collection
export const updateItem = async (collectionName: string, itemId: string, itemData: any): Promise<any> => {
  try {
    const url = `/${collectionName}/${itemId}`;
    const response: CollectionResponse = await dbAxiosInstance.patch(url, itemData);
    return response.data;
  } catch (error) {
    console.error(`Error updating item in ${collectionName}:`, error);
    throw error;
  }
};

// Fetch all chats for a user
export const fetchUserChats = async (): Promise<any> => {
  try {
    // This endpoint returns all chats created by this user id
    const response: CollectionResponse = await dbAxiosInstance.get(`/chats/user_auth`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};

// Fetch a specific chat by ID
export const fetchChatById = async (chatId: string): Promise<any> => {
  try {
    const response: CollectionResponse = await dbAxiosInstance.get(`/chats/${chatId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error;
  }
};

// Send a message to the chat
export const sendMessage = async (chatId: string, message: any): Promise<any> => {
  try {
    console.log('Sending message to chatId:', chatId);
    const response: CollectionResponse = await dbAxiosInstance.patch(`/chats/${chatId}/add_message`, { message });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Generate chat response
export const generateChatResponse = async (chatId: string): Promise<any> => {
  try {
    console.log('Generating chat response for chatId:', chatId);
    const response: CollectionResponse = await taskAxiosInstance.post(`/chat_response/${chatId}`);
    return response.data;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
};
import axios from 'axios';

const DB_API_PORT = process.env.REACT_APP_BACKEND_PORT || 3000;
const TASK_API_PORT = process.env.REACT_APP_WORKFLOW_PORT || 8000;

const DB_API_BASE_URL = `http://localhost:${DB_API_PORT}/api`;
const TASK_API_BASE_URL = `http://localhost:${TASK_API_PORT}`;

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
    const response: CollectionResponse = await axios.get(`${DB_API_BASE_URL}/collections`);
    return response.data;
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
};

// Fetch schema for a collection
export const fetchSchema = async (collectionName: string): Promise<any> => {
  try {
    const url = `${DB_API_BASE_URL}/collections/${collectionName}/schema`;
    console.log(`Fetching schema for ${collectionName} from:`, url);
    const response: SchemaResponse = await axios.get(url);
    console.log(`Fetched schema for ${collectionName}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching schema for ${collectionName}:`, error);
    throw error;
  }
};

// Execute a task by name
export const executeTask = async (taskName: string, inputs: any): Promise<any> => {
  try {
    const response: TaskResponse = await axios.post(`${TASK_API_BASE_URL}/execute_task`, {
      task_name: taskName,
      inputs: inputs,
    });
    return response.data;
  } catch (error) {
    console.error('Error executing task:', error);
    throw error;
  }
};

// Execute a task from definition
export const executeTaskFromDefinition = async (taskKwargs: any, inputKwargs: any): Promise<any> => {
  try {
    const response: TaskResponse = await axios.post(`${TASK_API_BASE_URL}/execute_task_from_definition`, {
      task_kwargs: taskKwargs,
      input_kwargs: inputKwargs,
    });
    return response.data;
  } catch (error) {
    console.error('Error executing task from definition:', error);
    throw error;
  }
};

// Fetch an item from a collection
export const fetchItem = async (collectionName: string, itemId: string | null = null): Promise<any> => {
  try {
    const url = itemId ? `${DB_API_BASE_URL}/${collectionName}/${itemId}` : `${DB_API_BASE_URL}/${collectionName}`;
    const response: CollectionResponse = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item from ${collectionName}:`, error);
    throw error;
  }
}

// Create a new item in a collection
export const createItem = async (collectionName: string, itemData: any): Promise<any> => {
  try {
    const url = `${DB_API_BASE_URL}/${collectionName}`;
    const response: CollectionResponse = await axios.post(url, itemData);
    return response.data;
  } catch (error) {
    console.error(`Error creating item in ${collectionName}:`, error);
    throw error;
  }
};

// Update an item in a collection
export const updateItem = async (collectionName: string, itemId: string, itemData: any): Promise<any> => {
  try {
    const url = `${DB_API_BASE_URL}/${collectionName}/${itemId}`;
    const response: CollectionResponse = await axios.put(url, itemData);
    return response.data;
  } catch (error) {
    console.error(`Error updating item in ${collectionName}:`, error);
    throw error;
  }
};

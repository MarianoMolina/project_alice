import { dbAxiosInstance, dbAxiosInstanceLMS } from './axiosInstance';
import { MessageType, PopulatedMessage } from '../types/MessageTypes';
import { CollectionName, CollectionPopulatedType, CollectionType } from '../types/CollectionTypes';
import { FileReference, FileContentReference } from '../types/FileTypes';
import { createFileContentReference } from '../utils/FileUtils';
import { converters, populatedConverters } from '../utils/Converters';
import { requestFileTranscript } from './workflowApi';
import { ApiName } from '../types/ApiTypes';
import { ApiConfigType } from '../utils/ApiUtils';
import Logger from '../utils/Logger';
import { convertToPopulatedChatThread, PopulatedChatThread } from '../types/ChatThreadTypes';
import { User, UserTier } from '../types/UserTypes';

export interface LMStudioModel {
  id: string;
  type: string;
  is_loaded: boolean;
  architecture: string;
  size: number;
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
      type: model.type || 'unknown',
      is_loaded: model.is_loaded,
      architecture: model.architecture || 'unknown',
      size: model.size || 0,
    }));

    Logger.debug('Fetched LM Studio models:', models);
    return models;
  } catch (error) {
    Logger.error('Error fetching LM Studio models:', error);
    throw error;
  }
};

/**
 * Unloads a specific model from LM Studio
 * @param model The LMStudioModel to unload
 * @returns Promise<void>
 */
export const unloadLMStudioModel = async (model: LMStudioModel): Promise<void> => {
  try {
    Logger.debug('Unloading LM Studio model:', model.id);
    await dbAxiosInstanceLMS.post(`/lm_studio/v1/models/unload/${model.id}`);
    Logger.debug('Successfully queued model unload for:', model.id);
  } catch (error) {
    Logger.error('Error unloading LM Studio model:', error);
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

export const fetchPopulatedItem = async <T extends CollectionName>(
  collectionName: T,
  itemId: string | null = null
): Promise<CollectionPopulatedType[T] | CollectionPopulatedType[T][]> => {
  collectionName = collectionName.toLowerCase() as T;
  Logger.debug("fetchPopulatedItem", collectionName, itemId);
  try {
    const url = itemId ?
      `/${collectionName}/${itemId}/populated` :
      `/${collectionName}`;

    const response = await dbAxiosInstance.get(url);
    const converter = populatedConverters[collectionName];
    Logger.debug("fetchPopulatedItem response", response.data);
    Logger.debug("fetchPopulatedItem converter", converter);

    if (Array.isArray(response.data)) {
      return response.data.map(item => converter(item)) as CollectionPopulatedType[T][];
    } else {
      const convert = converter(response.data) as CollectionPopulatedType[T];
      Logger.debug("fetchPopulatedItem convert", convert);
      return convert
    }
  } catch (error) {
    Logger.error(`Error fetching populated items from ${collectionName}:`, error, itemId);
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
  itemData: Partial<CollectionType[T] | CollectionPopulatedType[T]>
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
    Logger.debug('Purging and reinitializing database');
    const response = await dbAxiosInstance.post('/users/purge-and-reinitialize');
    Logger.debug('Database purged and reinitialized:', response.data.message);
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

export const sendMessage = async (chatId: string, threadId: string, message: PopulatedMessage): Promise<PopulatedChatThread> => {
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

    const response = await dbAxiosInstance.patch(`/chats/${chatId}/add_message`, { threadId, message });
    Logger.debug('Received response:', response.data);
    return convertToPopulatedChatThread(response.data.thread);
  } catch (error) {
    Logger.error('Error sending message:', error);
    throw error;
  }
};

export const addThreadToChat = async (
  chatId: string,
  threadId: string
): Promise<CollectionType['chats']> => {
  try {
    Logger.debug('Adding thread to chat:', chatId, threadId);
    const response = await dbAxiosInstance.patch(`/chats/${chatId}/add_thread`, { threadId });
    return converters['chats'](response.data.chat) as CollectionType['chats'];
  } catch (error) {
    Logger.error('Error adding thread to chat:', error);
    throw error;
  }
};

export const removeThreadFromChat = async (
  chatId: string,
  threadId: string
): Promise<CollectionType['chats']> => {
  try {
    Logger.debug('Removing thread from chat:', chatId, threadId);
    const response = await dbAxiosInstance.patch(`/chats/${chatId}/remove_thread`, { threadId });
    return converters['chats'](response.data.chat) as CollectionType['chats'];
  } catch (error) {
    Logger.error('Error removing thread from chat:', error);
    throw error;
  }
};

export const getAdminApiConfigMap = async (
  mapName: string = 'upgrade_admin_api_key_map'
): Promise<ApiConfigType> => {
  try {
    Logger.debug('Fetching admin API key map:', mapName);
    const response = await dbAxiosInstance.get(`/users/api-config-map/${mapName}`);
    Logger.debug('Received admin API key map:', response.data);
    Logger.debug('Config:', response.data.configs);
    return response.data.configs;
  } catch (error) {
    Logger.error('Error fetching admin API key map:', error);
    throw error;
  }
}

export const applyApiConfigToUser = async (
  userId: string,
  apiNames: ApiName[],
  mapName: string = 'upgrade_admin_api_key_map'
): Promise<void> => {
  try {
    Logger.debug('Applying API config to user:', userId, 'for APIs:', apiNames);
    const url = `/users/apply-api-config/${userId}`;
    const response = await dbAxiosInstance.post(url, { mapName, apiNames });
    Logger.debug('Successfully applied API config:', response.data);
  } catch (error) {
    Logger.error('Error applying API config to user:', error);
    throw error;
  }
};

export const updateAdminApiKeyMap = async (
  apiKeyMap: Partial<ApiConfigType>,
  mapName: string = 'upgrade_admin_api_key_map'
): Promise<void> => {
  try {
    const update_obj = {
      mapName,
      configs: apiKeyMap
    };
    Logger.debug('Updating admin API key map:', JSON.stringify(update_obj, null, 2));
    const response = await dbAxiosInstance.post(`/users/update-api-config-map`, update_obj);
    Logger.debug('Successfully updated admin API key map:', response.data);
  } catch (error) {
    Logger.error('Error updating admin API key map:', error);
    throw error;
  }
}

export interface UpdateUserStatsRequest {
  user_tier?: UserTier;
  interested_in_premium?: boolean;
}

export const updateUserStats = async (
  userId: string,
  updateData: UpdateUserStatsRequest
): Promise<User> => {
  try {
    Logger.debug('Updating user stats:', JSON.stringify(updateData));
    const response = await dbAxiosInstance.patch(
      `/users/${userId}/stats`, 
      updateData
    );
    return converters['users'](response.data.user) as CollectionType['users'];
  } catch (error) {
    Logger.error('Error updating user stats:', error);
    throw error;
  }
}
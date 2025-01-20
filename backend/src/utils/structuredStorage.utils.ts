import { StructureType } from '../interfaces/structuredStorage.interface';
import { Types } from 'mongoose';
import StructuredStorage from '../models/structuredStorage.model';
import APIConfig from '../models/apiConfig.model';
import Logger from './logger';
import { ApiConfigMapsStructure, ApiConfigType, ApiName, createEmptyApiConfig } from './api.utils';

/**
 * Updates or creates an API configuration map
 * @param mapKey - The key identifier for the map (e.g., "default_configs")
 * @param configs - Partial map of API configurations to update/create
 * @param userId - The ID of the user making the change
 * @returns The updated document
 */
export async function upsertApiConfigMap(
    mapKey: string,
    configs: Partial<{
        [K in ApiName]: ApiConfigType[K];
    }>,
    userId: Types.ObjectId
): Promise<ApiConfigMapsStructure> {
    let doc = await StructuredStorage.findOne({
        type: StructureType.API_CONFIG_MAPS,
        name: 'api_config_maps'
    });

    if (!doc) {
        doc = new StructuredStorage({
            name: 'api_config_maps',
            type: StructureType.API_CONFIG_MAPS,
            data: { [mapKey]: createEmptyApiConfig() },
            created_by: userId,
            updated_by: userId
        });
    }

    const data = doc.getTypedData<StructureType.API_CONFIG_MAPS>();

    if (!data[mapKey]) {
        data[mapKey] = createEmptyApiConfig();
    }

    // Type-safe update with explicit type checking
    Object.entries(configs).forEach(([key, value]) => {
        const apiName = key as ApiName;
        if (value) {
            // This cast is now safe because we've properly typed our interfaces
            (data[mapKey] as any)[apiName] = value;
        }
    });

    if (!StructuredStorage.validateStructureData(StructureType.API_CONFIG_MAPS, data)) {
        throw new Error('Invalid API configuration structure');
    }

    const updatedDoc = await StructuredStorage.findOneAndUpdate(
        {
            type: StructureType.API_CONFIG_MAPS,
            name: 'api_config_maps'
        },
        {
            $set: {
                data,
                updated_by: userId
            }
        },
        {
            new: true,
            upsert: true
        }
    );

    if (!updatedDoc) {
        throw new Error('Failed to update API configuration map');
    }

    return updatedDoc.data as ApiConfigMapsStructure;
}

export async function applyApiConfigFromMap(
    userId: string,
    mapName: string,
    apiNames?: ApiName[]
): Promise<void> {
    try {
        // Get the API config map
        const configMap = await StructuredStorage.findOne({
            type: StructureType.API_CONFIG_MAPS,
            name: 'api_config_maps'
        });

        if (!configMap) {
            throw new Error('API configuration map not found');
        }

        const data = configMap.getTypedData<StructureType.API_CONFIG_MAPS>();
        const selectedMap = data[mapName];

        if (!selectedMap) {
            throw new Error(`API configuration map "${mapName}" not found`);
        }

        // Filter API names if provided
        const targetApiNames = apiNames || Object.keys(selectedMap) as ApiName[];
        Logger.debug(`Applying API configurations for user ${userId} using map ${mapName} for APIs:`, targetApiNames);
        // Create map of API configurations to apply
        const apiConfigMap: { [key: string]: any } = {};
        for (const apiName of targetApiNames) {
            const config = selectedMap[apiName];
            if (config) {
                apiConfigMap[apiName] = config;
            }
        }

        if (Object.keys(apiConfigMap).length === 0) {
            throw new Error('No valid API configurations found');
        }

        // Find all API configs for the user
        const userConfigs = await APIConfig.find({
            created_by: new Types.ObjectId(userId),
            api_name: { $in: targetApiNames }
        });

        // Update each config with the map data
        const updatePromises = userConfigs.map(config => {
            const newData = apiConfigMap[config.api_name];
            if (newData) {
                config.health_status = 'healthy';
                config.data = newData;
                return config.save();
            }
            return Promise.resolve();
        });

        await Promise.all(updatePromises);
        Logger.debug(`Updated API configs for user ${userId} using map ${mapName}`);
    } catch (error) {
        Logger.error('Error in applyApiConfigFromMap:', error);
        throw error;
    }
}
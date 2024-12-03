import { Types } from 'mongoose';
import { IDataClusterDocument, References } from '../interfaces/references.interface';
import { DataCluster } from '../models/reference.model';
import { compareReferences, processReferences } from './reference.utils';
import Logger from './logger';

export async function createDataCluster(
  clusterData: Partial<IDataClusterDocument>,
  userId: string
): Promise<IDataClusterDocument | null> {
  try {
    Logger.debug('clusterData received in createDataCluster:', clusterData);
    
    if ('_id' in clusterData) {
      Logger.warn(`Removing _id from clusterData: ${clusterData._id}`);
      delete clusterData._id;
    }

    // First process the references part
    const processedReferences = await processReferences(clusterData, userId);

    // Then create the full document data
    const fullClusterData = {
      ...processedReferences,
      created_by: new Types.ObjectId(userId),
      updated_by: new Types.ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    Logger.debug('Final cluster data before creating DataCluster object:', JSON.stringify(fullClusterData, null, 2));

    let dataCluster: IDataClusterDocument;
    try {
      dataCluster = new DataCluster(fullClusterData);
    } catch (error) {
      Logger.error('Error creating DataCluster object:', error);
      throw error;
    }

    const savedCluster = await dataCluster.save();
    Logger.debug(`DataCluster created with ID: ${savedCluster._id}`);

    return await DataCluster.findById(savedCluster._id);
  } catch (error) {
    Logger.error('Error in createDataCluster:', error);
    if (error instanceof Error) {
      Logger.error('Error stack:', error.stack);
    }
    return null;
  }
}

export async function updateDataCluster(
  clusterId: string,
  clusterData: Partial<IDataClusterDocument>,
  userId: string
): Promise<IDataClusterDocument | null> {
  try {
    const existingCluster = await DataCluster.findById(clusterId);
    if (!existingCluster) {
      throw new Error('DataCluster not found');
    }

    // Process the references part
    const processedReferences = await processReferences(clusterData, userId);

    const isEqual = dataClustersEqual(existingCluster, processedReferences);

    if (isEqual) {
      return existingCluster;
    }

    // Add document update fields
    const updateData = {
      ...processedReferences,
      updated_by: new Types.ObjectId(userId),
      updatedAt: new Date()
    };

    const updatedCluster = await DataCluster.findByIdAndUpdate(
      clusterId,
      updateData,
      { new: true, runValidators: true }
    );

    return updatedCluster;
  } catch (error) {
    Logger.error('Error updating data cluster:', error);
    return null;
  }
}

function dataClustersEqual(
  cluster1: IDataClusterDocument,
  cluster2: References
): boolean {
  return compareReferences(cluster1, cluster2);
}
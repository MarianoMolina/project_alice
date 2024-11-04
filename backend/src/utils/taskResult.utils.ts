import { Types } from 'mongoose';
import { ITaskResultDocument, NodeResponse } from '../interfaces/taskResult.interface';
import TaskResult from '../models/taskResult.model';
import Logger from './logger';
import { processReferences } from './reference.utils';
import { processEmbeddings } from './embeddingChunk.utils';

async function processNodeReferences(
  nodeResponses: NodeResponse[],
  userId: string
): Promise<NodeResponse[]> {
  return Promise.all(nodeResponses.map(async (nodeResponse) => ({
    ...nodeResponse,
    references: nodeResponse.references ? 
      await processReferences(nodeResponse.references, userId) : 
      nodeResponse.references
  })));
}

export async function createTaskResult(
  taskResultData: Partial<ITaskResultDocument>,
  userId: string
): Promise<ITaskResultDocument | null> {
  try {
    Logger.debug('taskResultData received in createTaskResult:', taskResultData);
    
    if ('_id' in taskResultData) {
      Logger.warn(`Removing _id from taskResultData: ${taskResultData._id}`);
      delete taskResultData._id;
    }

    // Process node references if they exist
    if (taskResultData.node_references?.length) {
      taskResultData.node_references = await processNodeReferences(
        taskResultData.node_references,
        userId
      );
    }
    if (taskResultData.embedding) {
      taskResultData.embedding = await processEmbeddings(taskResultData, userId);
    }

    // Set created_by and timestamps
    taskResultData.created_by = userId ? new Types.ObjectId(userId) : undefined;
    taskResultData.createdAt = new Date();
    taskResultData.updatedAt = new Date();

    // Create and save the task result
    const taskResult = new TaskResult(taskResultData);
    await taskResult.save();
    return await TaskResult.findById(taskResult._id);
  } catch (error) {
    Logger.error('Error creating task result:', error);
    return null;
  }
}

export async function updateTaskResult(
  taskResultId: string,
  taskResultData: Partial<ITaskResultDocument>,
  userId: string
): Promise<ITaskResultDocument | null> {
  try {
    Logger.info('taskResultData received in updateTaskResult:', taskResultData);
    
    const existingTaskResult = await TaskResult.findById(taskResultId);
    if (!existingTaskResult) {
      throw new Error('Task result not found');
    }

    // Process node references if they exist
    if (taskResultData.node_references?.length) {
      taskResultData.node_references = await processNodeReferences(
        taskResultData.node_references,
        userId
      );
    }
    if (taskResultData.embedding) {
      taskResultData.embedding = await processEmbeddings(taskResultData, userId);
    }

    // Compare the existing task result with the new data
    const isEqual = taskResultsEqual(existingTaskResult, taskResultData);
    if (isEqual) {
      // No changes detected, return existing task result
      return existingTaskResult;
    }

    // Set updated_by and updatedAt
    taskResultData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
    taskResultData.updatedAt = new Date();

    // Update the task result
    const updatedTaskResult = await TaskResult.findByIdAndUpdate(
      taskResultId,
      taskResultData,
      { new: true, runValidators: true }
    );
    return updatedTaskResult;
  } catch (error) {
    Logger.error('Error updating task result:', error);
    return null;
  }
}

function compareNodeReferences(
  nodes1?: NodeResponse[],
  nodes2?: NodeResponse[]
): boolean {
  if (!nodes1 && !nodes2) return true;
  if (!nodes1 || !nodes2) return false;
  if (nodes1.length !== nodes2.length) return false;

  return nodes1.every((node1, index) => {
    const node2 = nodes2[index];
    return (
      node1.node_name === node2.node_name &&
      node1.execution_order === node2.execution_order &&
      node1.exit_code === node2.exit_code &&
      JSON.stringify(node1.references) === JSON.stringify(node2.references)
    );
  });
}

export function taskResultsEqual(
  tr1: ITaskResultDocument,
  tr2: Partial<ITaskResultDocument>
): boolean {
  const keys: (keyof ITaskResultDocument)[] = [
    'task_name',
    'task_id',
    'task_description',
    'status',
    'result_code',
    'task_outputs',
    'task_inputs',
    'result_diagnostic',
    'usage_metrics',
    'execution_history',
    'node_references'
  ];

  for (const key of keys) {
    if (key === 'node_references') {
      // Compare node references using dedicated comparison function
      if (!compareNodeReferences(tr1[key], tr2[key])) {
        return false;
      }
    } else if (JSON.stringify(tr1[key]) !== JSON.stringify(tr2[key])) {
      return false;
    }
  }

  return true;
}
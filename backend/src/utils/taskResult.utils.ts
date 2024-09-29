import { Types } from 'mongoose';
import { ITaskResultDocument } from '../interfaces/taskResult.interface';
import TaskResult from '../models/taskResult.model';
import Logger from './logger';
import { processReferences } from './reference.utils';

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

    // Process references if they exist
    if (taskResultData.references) {
      taskResultData.references = await processReferences(taskResultData.references, userId);
    }

    // Set created_by and timestamps
    taskResultData.created_by = userId ? new Types.ObjectId(userId) : undefined;
    taskResultData.createdAt = new Date();
    taskResultData.updatedAt = new Date();

    // Create and save the task result
    const taskResult = new TaskResult(taskResultData);
    await taskResult.save();
    return taskResult;
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

    // Process references if they exist
    if (taskResultData.references) {
      taskResultData.references = await processReferences(taskResultData.references, userId);
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
    'references'
  ];
  for (const key of keys) {
    if (key === 'references') {
      // Compare references using deep comparison
      if (JSON.stringify(tr1[key]) !== JSON.stringify(tr2[key])) {
        return false;
      }
    } else if (JSON.stringify(tr1[key]) !== JSON.stringify(tr2[key])) {
      return false;
    }
  }
  return true;
}
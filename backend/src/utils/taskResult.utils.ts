import { Types } from 'mongoose';
import { ITaskResultDocument, NodeResponse } from '../interfaces/taskResult.interface';
import TaskResult from '../models/taskResult.model';
import Logger from './logger';
import { processReferences } from './reference.utils';
import { processEmbeddings } from './embeddingChunk.utils';
import { References } from '../interfaces/references.interface';
import { InteractionOwnerType } from '../interfaces/userInteraction.interface';

// Track processed items to prevent infinite loops
class ReferenceProcessor {
  private processedIds: Set<string> = new Set();
  private processingDepth: number = 0;
  private readonly MAX_DEPTH = 20; // Maximum nesting depth to prevent infinite recursion

  constructor() {
    this.processedIds = new Set();
    this.processingDepth = 0;
  }

  hasProcessed(id: string): boolean {
    return this.processedIds.has(id);
  }

  markAsProcessed(id: string): void {
    this.processedIds.add(id);
  }

  incrementDepth(): void {
    this.processingDepth++;
  }

  decrementDepth(): void {
    this.processingDepth--;
  }

  isMaxDepthReached(): boolean {
    return this.processingDepth >= this.MAX_DEPTH;
  }

  getCurrentDepth(): number {
    return this.processingDepth;
  }
}

// Helper function to process user interactions within references
async function processUserInteractionsInReferences(
  references: References | undefined, 
  taskResultId: string,
  processor: ReferenceProcessor,
  path: string = 'root'
): Promise<References | undefined> {
  if (!references) return undefined;

  Logger.debug(`Processing references at path: ${path}, depth: ${processor.getCurrentDepth()}`);

  if (processor.isMaxDepthReached()) {
    Logger.warn(`Max depth reached at path: ${path}. Stopping further processing.`);
    return references;
  }

  processor.incrementDepth();

  try {
    // Process user interactions directly in the references
    if (references.user_interactions?.length) {
      Logger.debug(`Processing ${references.user_interactions.length} user interactions at ${path}`);
      for (const interaction of references.user_interactions) {
        // Skip if it's an ObjectId or string
        if (typeof interaction === 'string' || interaction instanceof Types.ObjectId) {
          continue;
        }

        // Only try to set task_response_id if we have an object
        if (interaction && typeof interaction === 'object' && !interaction.owner) {
          interaction.owner =  {
            type: InteractionOwnerType.TASK_RESPONSE,
            id: new Types.ObjectId(taskResultId)
          }
        } else {
          Logger.warn(`Skipping invalid user interaction at ${path} - ${JSON.stringify(interaction)}`);
        }
      }
    }

    // Recursively process user interactions in messages
    if (references.messages?.length) {
      Logger.debug(`Processing ${references.messages.length} messages at ${path}`);
      for (let i = 0; i < references.messages.length; i++) {
        const message = references.messages[i];
        if (typeof message !== 'string' && !(message instanceof Types.ObjectId)) {
          if (message._id && processor.hasProcessed(message._id.toString())) {
            Logger.debug(`Skipping already processed message: ${message._id} at ${path}`);
            continue;
          }

          if (message._id) {
            processor.markAsProcessed(message._id.toString());
          }

          if (message.references) {
            message.references = await processUserInteractionsInReferences(
              message.references, 
              taskResultId, 
              processor,
              `${path}.messages[${i}]`
            ) as References;
          }
        }
      }
    }

    // Recursively process user interactions in task_responses
    if (references.task_responses?.length) {
      Logger.debug(`Processing ${references.task_responses.length} task responses at ${path}`);
      for (let i = 0; i < references.task_responses.length; i++) {
        const taskResponse = references.task_responses[i];
        if (typeof taskResponse !== 'string' && !(taskResponse instanceof Types.ObjectId)) {
          if (taskResponse._id && processor.hasProcessed(taskResponse._id.toString())) {
            Logger.debug(`Skipping already processed task response: ${taskResponse._id} at ${path}`);
            continue;
          }

          if (taskResponse._id) {
            processor.markAsProcessed(taskResponse._id.toString());
          }

          if (taskResponse.node_references?.length) {
            taskResponse.node_references = await processNodeReferencesWithInteractions(
              taskResponse.node_references,
              taskResultId,
              processor,
              `${path}.task_responses[${i}]`
            );
          }
        }
      }
    }

    return references;
  } catch (error) {
    // Capture stack trace
    const stack = error instanceof Error ? error.stack : new Error().stack;
    
    // Create detailed error message
    const errorDetails = {
      receivedValue: references === null ? 'null' : 
                    references === undefined ? 'undefined' : 
                     typeof references === 'object' ? JSON.stringify(references) : 
                     String(references),
      receivedType: typeof references,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: stack
    };

    Logger.error('Error during references processing:', {
      error: errorDetails,
      stack: stack
    });

    return references;
  } finally {
    processor.decrementDepth();
  }
}

// Helper function to process node references and their nested user interactions
async function processNodeReferencesWithInteractions(
  nodeResponses: NodeResponse[],
  taskResultId: string,
  processor: ReferenceProcessor,
  path: string = 'root'
): Promise<NodeResponse[]> {
  Logger.debug(`Processing node references with interactions at path: ${path}`);
  return Promise.all(nodeResponses.map(async (nodeResponse, index) => ({
    ...nodeResponse,
    references: nodeResponse.references ? 
      await processUserInteractionsInReferences(
        nodeResponse.references, 
        taskResultId, 
        processor,
        `${path}.nodeResponse[${index}]`
      ) as References : 
      nodeResponse.references
  })));
}

async function processNodeReferences(
  nodeResponses: NodeResponse[],
  userId: string,
  taskResultId?: string
): Promise<NodeResponse[]> {
  Logger.debug(`Starting processNodeReferences with taskResultId: ${taskResultId}`);
  
  // First process user interactions if taskResultId is provided
  if (taskResultId) {
    const processor = new ReferenceProcessor();
    nodeResponses = await processNodeReferencesWithInteractions(
      nodeResponses,
      taskResultId,
      processor
    );
  }

  // Then process the references normally
  return Promise.all(nodeResponses.map(async (nodeResponse) => {
    Logger.debug(`Processing references for node: ${nodeResponse.node_name}`);
    
    // Ensure we only include valid NodeResponse fields
    const cleanNodeResponse: NodeResponse = {
      parent_task_id: nodeResponse.parent_task_id,
      node_name: nodeResponse.node_name,
      execution_order: nodeResponse.execution_order,
      exit_code: nodeResponse.exit_code,
      references: nodeResponse.references ? 
        await processReferences(nodeResponse.references, userId) : 
        undefined
    };

    return cleanNodeResponse;
  }));
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

    // Store node references temporarily and remove from initial save
    const nodeReferences = taskResultData.node_references;
    delete taskResultData.node_references;

    Logger.debug('Creating initial task result without node references');
    // Create initial task result without node references
    const taskResult = new TaskResult({
      ...taskResultData,
      created_by: userId ? new Types.ObjectId(userId) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await taskResult.save();
    Logger.debug(`Initial task result created with ID: ${taskResult._id}`);

    // If we had node references, process them with the new task result ID
    if (nodeReferences?.length) {
      Logger.debug(`Processing ${nodeReferences.length} node references`);
      const processedNodeReferences = await processNodeReferences(
        nodeReferences,
        userId,
        taskResult._id.toString()
      );

      Logger.debug(`Updating task result with processed node references ${JSON.stringify(processedNodeReferences, null, 2)}`);
      // Update task result with processed references
      return await TaskResult.findByIdAndUpdate(
        taskResult._id,
        { node_references: processedNodeReferences },
        { new: true }
      );
    }

    return taskResult;
  } catch (error) {
    Logger.error('Error creating task result:', error);
    Logger.error(error instanceof Error && error.stack ? error.stack : 'No stack trace available');
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
        userId,
        taskResultId
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
    'node_references',
    'embedding'
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
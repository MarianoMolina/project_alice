import { Types } from 'mongoose';
import { IMessageDocument } from '../interfaces/message.interface';
import Message from '../models/message.model';
import { updateFile, storeFileReference } from './file.utils';
import { updateTaskResult, createTaskResult } from './taskResult.utils';
import Logger from './logger';

export async function createMessage(
  messageData: Partial<IMessageDocument>,
  userId: string
): Promise<IMessageDocument | null> {
  try {

    Logger.info('messageData received in createMessageInChat:', messageData);
    // Remove _id if present in messageData to ensure Mongoose generates a new one
    if ('_id' in messageData) {
      Logger.warn(`Removing _id from messageData: ${messageData._id}`);
      delete messageData._id;
    }

    // Handle file references
    if (messageData.references && Array.isArray(messageData.references)) {
      const processedReferences: Types.ObjectId[] = [];
      for (const ref of messageData.references) {
        let referenceId: Types.ObjectId;
        if (typeof ref === 'string' || ref instanceof Types.ObjectId) {
          // Existing file reference
          referenceId = new Types.ObjectId(ref);
        } else {
          if ('_id' in ref && ref._id) {
            const newFileRef = await updateFile(ref._id.toString(), ref, userId);
            if (!newFileRef) {
              throw new Error('Failed to create file reference');
            }
            referenceId = newFileRef._id;
          } else {
            // New file reference, create it
            const newFileRef = await storeFileReference(ref, userId);
            if (!newFileRef) {
              throw new Error('Failed to create file reference');
            }
            referenceId = newFileRef._id;
          }
        }
        processedReferences.push(referenceId);
      }
      messageData.references = processedReferences;
    }

    // Handle task responses
    if (messageData.task_responses && Array.isArray(messageData.task_responses)) {
      const processedTaskResponses: Types.ObjectId[] = [];
      for (const tr of messageData.task_responses) {
        let taskResponseId: Types.ObjectId;
        if (typeof tr === 'string' || tr instanceof Types.ObjectId) {
          // Existing task response
          taskResponseId = new Types.ObjectId(tr);
        } else {
          if ('_id' in tr && tr._id) {
            // Existing task response, update it
            const updatedTaskResponse = await updateTaskResult(tr._id.toString(), tr, userId);
            if (!updatedTaskResponse) {
              throw new Error('Failed to update task response');
            }
            taskResponseId = updatedTaskResponse._id;
          } else {
            // New task response, create it
            const newTaskResponse = await createTaskResult(tr, userId);
            if (!newTaskResponse) {
              throw new Error('Failed to create task response');
            }
            taskResponseId = newTaskResponse._id;
          }
        }
        processedTaskResponses.push(taskResponseId);
      }
      messageData.task_responses = processedTaskResponses;
    }

    // Set created_by and timestamps
    messageData.created_by = new Types.ObjectId(userId);
    messageData.createdAt = new Date();
    messageData.updatedAt = new Date();

    // Create and save the message
    const message = new Message(messageData);
    const savedMessage = await message.save();
    Logger.info('Message saved:', savedMessage);

    // Log the saved message ID
    Logger.info(`Message created with ID: ${savedMessage._id}`);

    return savedMessage;
  } catch (error) {
    Logger.error('Error creating message:', error);
    return null;
  }
}

export async function updateMessage(
  messageId: string,
  messageData: Partial<IMessageDocument>,
  userId: string
): Promise<IMessageDocument | null> {
  try {
    const existingMessage = await Message.findById(messageId);
    if (!existingMessage) {
      throw new Error('Message not found');
    }

    // Process references and task_responses before comparison
    const processedMessageData = { ...messageData };

    // Handle references
    if (messageData.references && Array.isArray(messageData.references)) {
      const processedReferences: Types.ObjectId[] = [];
      for (const ref of messageData.references) {
        if (typeof ref === 'string' || ref instanceof Types.ObjectId) {
          processedReferences.push(new Types.ObjectId(ref));
        } else if ('_id' in ref && ref._id) {
          // Existing reference, check for updates
          const updatedRef = await updateFile(ref._id.toString(), ref, userId);
          processedReferences.push(updatedRef?._id || new Types.ObjectId(ref._id));
        } else {
          // New reference, create it
          const newRef = await storeFileReference(ref, userId);
          processedReferences.push(newRef._id);
        }
      }
      processedMessageData.references = processedReferences;
    }

    // Handle task_responses
    if (messageData.task_responses && Array.isArray(messageData.task_responses)) {
      const processedTaskResponses: Types.ObjectId[] = [];
      for (const tr of messageData.task_responses) {
        if (typeof tr === 'string' || tr instanceof Types.ObjectId) {
          processedTaskResponses.push(new Types.ObjectId(tr));
        } else if ('_id' in tr && tr._id) {
          // Existing task response, check for updates
          const updatedTR = await updateTaskResult(tr._id.toString(), tr, userId);
          processedTaskResponses.push(updatedTR?._id || new Types.ObjectId(tr._id));
        } else {
          // New task response, create it
          const newTR = await createTaskResult(tr, userId);
          if (!newTR) {
            Logger.error('Failed to create task response');
            Logger.error(JSON.stringify(tr));
            throw new Error('Failed to create task response');
          }
          processedTaskResponses.push(newTR._id);
        }
      }
      processedMessageData.task_responses = processedTaskResponses;
    }

    // Compare the existing message with the new data
    const isEqual = messagesEqual(existingMessage, processedMessageData);

    if (isEqual) {
      // No changes detected, return existing message
      return existingMessage;
    }

    // Set updated_by and updatedAt
    processedMessageData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
    processedMessageData.updatedAt = new Date();

    // Update the message
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      processedMessageData,
      { new: true, runValidators: true }
    );

    return updatedMessage;
  } catch (error) {
    console.error('Error updating message:', error);
    return null;
  }
}

export function messagesEqual(
  msg1: IMessageDocument,
  msg2: Partial<IMessageDocument>
): boolean {
  const keys: (keyof IMessageDocument)[] = [
    'content',
    'role',
    'generated_by',
    'step',
    'assistant_name',
    'context',
    'type',
    'request_type',
    // 'references' and 'task_responses' will be compared separately
  ];

  for (const key of keys) {
    if (key === 'context') {
      if (JSON.stringify(msg1[key]) !== JSON.stringify(msg2[key])) {
        return false;
      }
    } else {
      if (msg1[key] !== msg2[key]) {
        return false;
      }
    }
  }

  // Compare 'references'
  if (msg2.references) {
    const existingRefs = (msg1.references || []).map((id) => id.toString());
    const newRefs = msg2.references.map((id) => id.toString());
    if (JSON.stringify(existingRefs) !== JSON.stringify(newRefs)) {
      return false;
    }
  }

  // Compare 'task_responses'
  if (msg2.task_responses) {
    const existingTRs = (msg1.task_responses || []).map((id) => id.toString());
    const newTRs = msg2.task_responses.map((id) => id.toString());
    if (JSON.stringify(existingTRs) !== JSON.stringify(newTRs)) {
      return false;
    }
  }

  return true;
}
import { Types } from 'mongoose';
import { IMessageDocument } from '../interfaces/message.interface';
import Message from '../models/message.model';
import { compareReferences, processReferences } from './reference.utils';
import Logger from './logger';
import { processEmbeddings } from './embeddingChunk.utils';
import { InteractionOwnerType } from '../interfaces/userInteraction.interface';

export async function createMessage(
  messageData: Partial<IMessageDocument>,
  userId: string,
  chatId?: string
): Promise<IMessageDocument | null> {
  try {
    Logger.debug('messageData received in createMessage:', messageData);
    
    if ('_id' in messageData) {
      Logger.warn(`Removing _id from messageData: ${messageData._id}`);
      delete messageData._id;
    }

    if (messageData.references) {
      messageData.references = await processReferences(
        messageData.references, 
        userId,
        chatId ? {
          id: chatId,
          type: InteractionOwnerType.CHAT
        } : undefined
      );
    }

    if (messageData.embedding) {
      messageData.embedding = await processEmbeddings(messageData, userId);
    }

    Logger.debug('Processed message data:', JSON.stringify(messageData, null, 2));

    if (!Types.ObjectId.isValid(userId)) {
      Logger.error('Invalid userId:', userId);
      throw new Error('Invalid userId');
    }

    messageData.created_by = new Types.ObjectId(userId);
    messageData.createdAt = new Date();
    messageData.updatedAt = new Date();

    Logger.debug('Final message data before creating Message object:', JSON.stringify(messageData, null, 2));

    let message: IMessageDocument;
    try {
      message = new Message(messageData);
    } catch (error) {
      Logger.error('Error creating Message object:', error);
      throw error;
    }

    Logger.debug('Message object created, data:', JSON.stringify(message.toObject(), null, 2));

    const savedMessage = await message.save();
    
    Logger.debug('Message saved successfully:', JSON.stringify(savedMessage.toObject(), null, 2));
    Logger.debug(`Message created with ID: ${savedMessage._id}`);

    return await Message.findById(savedMessage._id);
  } catch (error) {
    Logger.error('Error in createMessage:', error);
    if (error instanceof Error) {
      Logger.error('Error stack:', error.stack);
    }
    return null;
  }
}

export async function updateMessage(
  messageId: string,
  messageData: Partial<IMessageDocument>,
  userId: string,
  chatId?: string
): Promise<IMessageDocument | null> {
  try {
    const existingMessage = await Message.findById(messageId);
    if (!existingMessage) {
      throw new Error('Message not found');
    }

    const processedMessageData = { ...messageData };

    if (processedMessageData.references) {
      processedMessageData.references = await processReferences(
        processedMessageData.references, 
        userId,
        chatId ? {
          id: chatId,
          type: InteractionOwnerType.CHAT
        } : undefined
      );
    }

    if (processedMessageData.embedding) {
      processedMessageData.embedding = await processEmbeddings(processedMessageData, userId);
    }

    const isEqual = messagesEqual(existingMessage, processedMessageData);

    if (isEqual) {
      return existingMessage;
    }

    processedMessageData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
    processedMessageData.updatedAt = new Date();

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      processedMessageData,
      { new: true, runValidators: true }
    );

    return updatedMessage;
  } catch (error) {
    Logger.error('Error updating message:', error);
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
    'type',
    'creation_metadata'
  ];

  for (const key of keys) {
    if (key === 'creation_metadata') {
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
  if (!compareReferences(msg1.references, msg2.references)) {
    return false;
  }

  return true;
}

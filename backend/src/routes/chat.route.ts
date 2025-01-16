import { Response, Router } from 'express';
import { IAliceChatDocument } from '../interfaces/chat.interface';
import AliceChat from '../models/chat.model';
import { Types } from 'mongoose';
import { IMessageDocument } from '../interfaces/message.interface';
import auth from '../middleware/auth.middleware';
import { AuthRequest } from '../interfaces/auth.interface';
import { createRoutes } from '../utils/routeGenerator';
import { createChat, createMessageInChat, updateChat } from '../utils/chat.utils';
import Logger from '../utils/logger';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';
import { createMessage, updateMessage } from '../utils/message.utils';
import { IChatThreadDocument } from '../interfaces/thread.interface';
import { ChatThread } from '../models/thread.model';

// Create a router using routeGenerator for common CRUD routes
const chatRoutes = createRoutes<IAliceChatDocument, 'AliceChat'>(AliceChat, 'AliceChat', {
  createItem: async (data, userId) => {
    return await createChat(data, userId);
  },
  updateItem: async (id, data, userId) => {
    return await updateChat(id, data, userId);
  },
});

// Custom route for adding a message to a chat
const customRouter = Router();
customRouter.patch('/:chatId/add_message', async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params;
  const message: Partial<IMessageDocument> = req.body.message;
  const threadId = req.body.threadId;
  const userId = req.effectiveUserId;

  try {
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // Remove the _id field if it exists and is not a valid ObjectId
    if (message._id && !Types.ObjectId.isValid(message._id)) {
      delete message._id;
      Logger.info('Removed invalid _id from message');
    }
    const chatData = await AliceChat.findById(chatId);
    if (!chatData) {
      Logger.error(`Chat not found: ${chatId}`);
      return res.status(404).json({ message: 'Chat not found' });
    }
    Logger.debug('Message object before creating in chat', { message });
    let messageDoc
    if (message._id) {
      Logger.debug(`Updating existing message with ID: ${message._id}`);
      messageDoc = await updateMessage(
        message._id.toString(),
        message,
        userId,
        chatId
      );
    } else {
      Logger.debug('Creating new message');
      messageDoc = await createMessage(message, userId, chatId);
    }
    if (!messageDoc) {
      Logger.error('Error creating message');
      return res.status(500).json({ message: 'Error creating message' });
    }
    let chatThread: IChatThreadDocument
    if (!threadId) {
      // New thread 
      // Instantiate new thread
      chatThread = new ChatThread({
        _id: new Types.ObjectId(),
        messages: [messageDoc._id],
      });
      // Add new thread to chat threads and save
      chatData.threads?.push(chatThread._id as any);
      await chatData.save();
    } else {
      const existingThread = chatData.threads?.find((thread) => thread._id.toString() === threadId);
      if (!existingThread) {
        Logger.error(`Thread not found: ${threadId}`);
        return res.status(404).json({ message: 'Thread not found' });
      }
      chatThread = existingThread as IChatThreadDocument;
      chatThread.messages.push(messageDoc._id as any);
      await chatThread.save();
    }

    Logger.debug('Message added successfully', {
      chatId,
      messageId: messageDoc._id,
    });
    res.status(200).json({ message: 'Message added successfully', thread: chatThread });
  } catch (error) {
    Logger.error('Error in add_message route:', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    res.status(500).json({ message: (error as Error).message, stack: (error as Error).stack });
  }
});
// Combine generated and custom routes
const combinedRouter = Router();
combinedRouter.use(rateLimiterMiddleware);
combinedRouter.use(auth);
combinedRouter.use('/', chatRoutes);
combinedRouter.use('/', customRouter);

export default combinedRouter;
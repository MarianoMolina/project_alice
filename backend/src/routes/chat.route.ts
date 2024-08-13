import { Response, Router } from 'express';
import { IAliceChatDocument } from '../interfaces/chat.interface';
import AliceChat from '../models/chat.model';
import { Types } from 'mongoose';
import { IMessage } from '../interfaces/chat.interface';
import auth from '../middleware/auth.middleware';
import { AuthRequest } from '../interfaces/auth.interface';
import { createRoutes } from '../utils/routeGenerator';
import { chatHelpers } from '../utils/chatHelpers.utils';
import logger from '../utils/logger';

// Create a router using routeGenerator for common CRUD routes
const generatedRouter = createRoutes<IAliceChatDocument, 'AliceChat'>(AliceChat, 'AliceChat');

// Custom route definitions
const customRouter = Router();

customRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const saved_chat = await chatHelpers.create_chat(req.body, req.user?.userId)
    res.status(201).json(saved_chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Internal Server Error', error: (error as Error).message });
  }
});

customRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user_id = req.user?.userId;
  const user_role = req.user?.role;
  try {
    const chat = await AliceChat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    if (chat.created_by.toString() !== user_id && user_role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to update this chat' });
    }
    console.log('Updating chat:', req.body);
    console.log('Chat:', chat);

    const updatedChatResult = await chatHelpers.edit_chat(id, req.body, user_id);
    res.status(200).json({ message: 'Chat updated successfully', chat: updatedChatResult });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

customRouter.patch('/:chatId/add_message', async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params;
  const message: Partial<IMessage> = req.body.message;
  const userId = req.user?.userId;

  logger.debug(`Received request to add message to chat ${chatId}`, { 
    chatId, 
    userId, 
    messageContent: message.content,
    hasTaskResponse: !!message.task_responses
  });

  try {
    // Remove the _id field if it exists and is not a valid ObjectId
    if (message._id && !Types.ObjectId.isValid(message._id)) {
      delete message._id;
      logger.info('Removed invalid _id from message');
    }

    logger.debug('Message object before creating in chat', { message });

    const updatedChat = await chatHelpers.create_message_in_chat(chatId, message, userId);
    
    if (!updatedChat) {
      logger.error(`Chat not found: ${chatId}`);
      return res.status(404).json({ message: 'Chat not found' });
    }

    logger.info('Message added successfully', { 
      chatId, 
      messageId: updatedChat._id,
      hasTaskResponse: updatedChat.task_responses?.length
    });

    res.status(200).json({ message: 'Message added successfully', chat: updatedChat });
  } catch (error) {
    logger.error('Error in add_message route:', { 
      error: (error as Error).message, 
      stack: (error as Error).stack 
    });
    res.status(500).json({ message: (error as Error).message, stack: (error as Error).stack });
  }
});
customRouter.patch('/:chatId/add_task_response', async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params;
  const { taskResultId } = req.body;
  const userId = req.user?.userId;
  try {

    const updatedChat = await chatHelpers.add_task_result_to_chat(chatId, taskResultId, userId);

    if (!updatedChat) {
      console.log('Failed to update chat:', chatId);
      return res.status(500).json({ message: 'Failed to update chat' });
    }
    res.status(200).json({ message: 'Task response added successfully', chat: updatedChat });
  } catch (error) {
    console.error('Error in add_task_response route:', error);
    res.status(500).json({ message: (error as Error).message, stack: (error as Error).stack });
  }
});

// Combine generated and custom routes
const combinedRouter = Router();
combinedRouter.use(auth); // Apply auth middleware to all routes
combinedRouter.use('/', generatedRouter);
combinedRouter.use('/', customRouter);

export default combinedRouter;
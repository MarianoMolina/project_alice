import { Response, Router } from 'express';
import { IAliceChatDocument } from '../interfaces/chat.interface';
import AliceChat from '../models/chat.model';
import mongoose, { Types } from 'mongoose';
import TaskResult from '../models/taskresult.model';
import { IMessage, IMessageDocument } from '../interfaces/chat.interface';
import auth from '../middleware/auth.middleware';
import { AuthRequest } from '../interfaces/auth.interface';
import { checkAndUpdateChanges, checkArrayChangesAndUpdate, messagesEqual } from '../utils/utils';
import { createRoutes } from '../utils/routeGenerator';

// Create a router using routeGenerator for common CRUD routes
const generatedRouter = createRoutes<IAliceChatDocument, 'AliceChat'>(AliceChat, 'AliceChat');

// Custom route definitions
const customRouter = Router();

customRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { messages = [] } = req.body;
    const user_id = req.user?.userId;

    console.log("Creating chat: ", req.body);

    const updatedMessages = messages.map((message: IMessage) => ({
      ...message,
      created_by: user_id ? new Types.ObjectId(user_id) : undefined,
      updated_by: user_id ? new Types.ObjectId(user_id) : undefined,
    }));

    const newChat = new AliceChat({
      ...req.body,
      messages: updatedMessages,
      created_by: user_id ? new Types.ObjectId(user_id) : undefined,
      updated_by: user_id ? new Types.ObjectId(user_id) : undefined,
    });

    const saved_chat = await newChat.save();
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
    const updatedChat = { ...req.body, updated_by: user_id ? new Types.ObjectId(user_id) : undefined };
    const changeHistoryData: any = { changed_by: user_id ? new Types.ObjectId(user_id) : undefined };

    checkAndUpdateChanges(chat, updatedChat, changeHistoryData, 'alice_agent');
    checkAndUpdateChanges(chat, updatedChat, changeHistoryData, 'executor');
    checkArrayChangesAndUpdate(chat, updatedChat, changeHistoryData, 'functions');

    if (req.body.model && JSON.stringify(req.body.model) !== JSON.stringify(chat.model)) {
      changeHistoryData.previous_model = chat.model;
      changeHistoryData.updated_model = req.body.model;
      chat.model = req.body.model;
    }

    if (req.body.messages && Array.isArray(req.body.messages)) {
      for (const msg of req.body.messages) {
        const existingMessageIndex = chat.messages.findIndex(m => m._id && m._id.toString() === msg._id);
        if (existingMessageIndex > -1) {
          if (!messagesEqual(chat.messages[existingMessageIndex], msg)) {
            chat.messages[existingMessageIndex] = {
              ...chat.messages[existingMessageIndex].toObject(),
              ...msg,
              updated_by: user_id ? new Types.ObjectId(user_id) : undefined,
            } as IMessageDocument;

            if (msg.task_responses && Array.isArray(msg.task_responses)) {
              chat.messages[existingMessageIndex].task_responses = await handleTaskResponses(msg.task_responses);
            }
          }
        } else {
          const newMessage: IMessageDocument = new mongoose.Model({
            ...msg,
            created_by: msg.created_by ? new Types.ObjectId(msg.created_by) : user_id ? new Types.ObjectId(user_id) : undefined,
            updated_by: user_id ? new Types.ObjectId(user_id) : undefined,
          }) as IMessageDocument;

          if (msg.task_responses && Array.isArray(msg.task_responses)) {
            newMessage.task_responses = await handleTaskResponses(msg.task_responses);
          }

          chat.messages.push(newMessage);
        }
      }
    }

    if (Object.keys(changeHistoryData).length > 1) {
      chat.changeHistory.push(changeHistoryData);
    }

    const updatedChatResult = await AliceChat.findByIdAndUpdate(id, chat, { new: true, runValidators: true });
    res.status(200).json({ message: 'Chat updated successfully', chat: updatedChatResult });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

customRouter.patch('/:chatId/add_message', async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params;
  const { message } = req.body;
  const userId = req.user?.userId;
  try {
    const chat = await AliceChat.findById(chatId);
    if (!chat) {
      console.log('Chat not found:', chatId);
      return res.status(404).json({ message: 'Chat not found' });
    }
    const newMessage: IMessageDocument = {
      ...message,
      created_by: userId ? new Types.ObjectId(userId) : undefined,
    };
    chat.messages.push(newMessage);
    if (userId) chat.updated_by = new Types.ObjectId(userId);
    await chat.save();
    console.log('Chat updated successfully', chat);
    const chat_updated = await AliceChat.findById(chatId);
    res.status(200).json({ message: 'Message added successfully', chat: chat_updated });
  } catch (error) {
    console.error('Error in add_message route:', error);
    res.status(500).json({ message: (error as Error).message, stack: (error as Error).stack });
  }
});

customRouter.patch('/:chatId/add_task_response', async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params;
  const { messageId, taskResultId } = req.body;
  const userId = req.user?.userId;
  try {
    const chat = await AliceChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const message = chat.messages.find(
      (msg) => msg._id.toString() === messageId
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found in this chat' });
    }

    message.task_responses.push(new Types.ObjectId(taskResultId));
    if (userId) chat.updated_by = new Types.ObjectId(userId);

    await chat.save();
    res.status(200).json({ message: 'Task response added successfully to the message' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

async function handleTaskResponses(taskResponses: any[]): Promise<Types.ObjectId[]> {
  const processedTaskResponses: Types.ObjectId[] = [];
  for (const tr of taskResponses) {
    if (typeof tr === 'string') {
      processedTaskResponses.push(new Types.ObjectId(tr));
    } else if (typeof tr === 'object' && tr !== null) {
      if (tr._id) {
        await TaskResult.findByIdAndUpdate(tr._id, tr);
        processedTaskResponses.push(new Types.ObjectId(tr._id));
      } else {
        const newTaskResult = new TaskResult(tr);
        const savedTaskResult = await newTaskResult.save();
        processedTaskResponses.push(savedTaskResult._id as Types.ObjectId);
      }
    }
  }
  return processedTaskResponses;
}

// Combine generated and custom routes
const combinedRouter = Router();
combinedRouter.use(auth); // Apply auth middleware to all routes
combinedRouter.use('/', generatedRouter);
combinedRouter.use('/', customRouter);

export default combinedRouter;

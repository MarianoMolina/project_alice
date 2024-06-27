const express = require('express');
const router = express.Router();
const { AliceChat } = require('../models/Chat');
const ChangeHistory = require('../models/ChangeHistorySchema');
const auth = require('../middleware/auth');

// POST / - Create a new chat
router.post('/', auth, async (req, res) => {
  try {
    const { name = "New chat", messages = [], alice_agent, functions = [], executor, llm_config = {} } = req.body;
    const user_id = req.user.userId;

    console.log("Creating chat: ", req.body);

    // Update the created_by and updated_by fields for each message
    const updatedMessages = messages.map(message => ({
      ...message,
      created_by: user_id,
      updated_by: user_id,
    }));

    const newChat = new AliceChat({
      name,
      messages: updatedMessages,
      alice_agent,
      functions,
      executor,
      llm_config,
      created_by: user_id,
      updated_by: user_id,
    });

    await newChat.save();
    res.status(201).json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.get('/user_auth', auth, async (req, res) => {
  try {
    const user_id = req.user.userId;
    const chats = await AliceChat.find({ created_by: user_id });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  const user_role = req.user.role;
  console.log('User role:', user_role)
  console.log('User ID:', req.user.userId)
  try {
    if (user_role === 'admin') {
      const chats = await AliceChat.find();
      res.status(200).json(chats);
    } else {
      res.status(403).json({ message: 'Unauthorized to view all chats' });
    }
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /:id - Get a chat by ID
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.userId;
  const user_role = req.user.role;
  try {
    let chat;
    if (user_role === 'admin') {
      // Admin can retrieve any chat
      chat = await AliceChat.findById(id);
    } else {
      // Regular user can only retrieve chats they created
      chat = await AliceChat.findOne({ _id: id, created_by: user_id });
    }
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or unauthorized' });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.userId;
  const user_role = req.user.role;
  try {
    const chat = await AliceChat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    if (chat.created_by !== user_id && user_role != 'admin') {
      return res.status(403).json({ message: 'Unauthorized to update this chat' });
    }
    if (chat.messages.length > 0) {
      const updatedMessages = chat.messages.map(message => ({
        ...message,
        created_by: message.created_by ? message.created_by : user_id,
        updated_by: message.updated_by ? message.updated_by : user_id,
      }));
      chat.messages = updatedMessages;
    };

    const updatedChat = {
      ...req.body,
      updated_by: user_id,
    };
    await AliceChat.findByIdAndUpdate(id, updatedChat, { new: true , runValidators: true });
    res.status(200).json({ message: 'Chat updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /:chatId/agent - Update agent in chat
router.patch('/:chatId/agent', auth, async (req, res) => {
  const { chatId } = req.params;
  const { newAgentId } = req.body;
  const userId = req.user.userId; // Assuming req.user contains the authenticated user's ID
  try {
    const chat = await AliceChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    // Record the change
    const change = new ChangeHistory({
      previous_agent: chat.alice_agent,
      updated_agent: newAgentId,
      changed_by: userId,
    });
    await change.save();
    // Update the agent in the chat
    chat.alice_agent = newAgentId;
    chat.updated_by = userId;
    await chat.save();
    res.status(200).json({ message: 'Agent updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /:chatId/add_message - Add a message to the chat
router.patch('/:chatId/add_message', auth, async (req, res) => {
  const { chatId } = req.params;
  const { message } = req.body;
  const userId = req.user.userId;
  try {
    // console.log('Received request:', { chatId, message, userId });
    const chat = await AliceChat.findById(chatId);
    if (!chat) {
      console.log('Chat not found:', chatId);
      return res.status(404).json({ message: 'Chat not found' });
    }
    // console.log('Found chat:', chat);
    const updatedMessage = {
      ...message,
      created_by: userId,
    };
    chat.messages.push(updatedMessage);
    chat.updated_by = userId;
    await chat.save();
    console.log('Chat updated successfully');
    res.status(200).json({ message: 'Message added successfully', chat });
  } catch (error) {
    console.error('Error in add_message route:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

router.patch('/:chatId/add_task_response', auth, async (req, res) => {
  const { chatId } = req.params;
  const { taskResponseId } = req.body;
  const userId = req.user.userId;
  try {
    const chat = await AliceChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    chat.task_responses.push(taskResponseId);
    chat.updated_by = userId;
    await chat.save();
    res.status(200).json({ message: 'Task response added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// DELETE /:chatId - Delete a chat
router.delete('/:chatId', auth, async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  try {
    const chat = await AliceChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    if (chat.created_by !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this chat' });
    } else {
      await AliceChat.findByIdAndDelete(chatId);
      res.status(200).json({ message: 'Chat deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
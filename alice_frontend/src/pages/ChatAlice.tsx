import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import Chat from '../components/Chat';
import Sidebar from '../components/Sidebar';
import ChatInput from '../components/ChatInput';
import { fetchUserChats, fetchChatById, sendMessage, generateChatResponse, createChat, fetchItem } from '../services/api';
import { MessageType, AliceChat, AliceAgent } from '../utils/types';
import { useAuth } from '../context/AuthContext';

const ChatAlice: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [pastChats, setPastChats] = useState<AliceChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [agents, setAgents] = useState<AliceAgent[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const fetchAllChats = async () => {
        try {
          const chats = await fetchUserChats();
          setPastChats(chats);
        } catch (error) {
          console.error('Error fetching chats:', error);
        }
      };

      fetchAllChats();
    }
  }, [user]);

  const handleSelectAgent = async (agentId: string | null): Promise<AliceAgent> => {
    if (agentId) {
      const agent = await fetchItem("agents", agentId);
      return agent;
    } else {
      agentId = '667899a632793b02d478efdd'
      return handleSelectAgent(agentId)
      // const defaultAgent = {
      //   name: 'Default Agent',
      //   system_message: '66771881a9f9a15c161a8c40',
      // };
      // const newAgent = await createItem("agents", defaultAgent);
      // return newAgent;
    }
  };

  const handleSelectExecutorAgent = async (agentId: string | null): Promise<AliceAgent> => {
    if (agentId) {
      const agent = await fetchItem("agents", agentId);
      return agent;
    } else {
      agentId = '6678997432793b02d478efdb'
      return handleSelectExecutorAgent(agentId)
      // const defaultAgent = {
      //   name: 'executor_agent',
      //   system_message: '66732c86ba1560b00ad0a643',
      //   autogen_class: 'UserProxyAgent',
      //   code_execution_config: true,
      //   default_auto_reply: '',
      // };
      // const newAgent = await createItem("agents", defaultAgent);
      // return newAgent;
    }
  }

  const handleSelectChat = async (chat: AliceChat | null) => {
    if (chat) {
      try {
        const chatData = await fetchChatById(chat._id);
        console.log('Chat data:', chatData);  // Add this log
        setMessages(chatData.messages);
        setCurrentChatId(chat._id);
        setAgents([chat.alice_agent]);
        console.log('Agents:', [chat.alice_agent]);  // Add this log
      } catch (error) {
        console.error('Error fetching chat:', error);
      }
    } else {
      // Create a new chat
      try {
        console.log('Creating a new chat');  // Add this log
        const agent = await handleSelectAgent(null);
        const executor_agent = await handleSelectExecutorAgent(null);
        const newChat = await createChat({ name: 'New Chat', alice_agent: agent._id, executor: executor_agent._id }); // Replace with actual logic for creating a new chat
        console.log('New chat created:', newChat);  // Add this log
        setMessages([]);
        setCurrentChatId(newChat._id);
        setAgents([agent]);
        setPastChats([...pastChats, newChat]);
      } catch (error) {
        console.error('Error creating new chat:', error);
      }
    }
  };

  const handleSendMessage = async (messageContent: string) => {
    try {
      console.log('Current chatId in handleSendMessage:', currentChatId);  // Add this log
      if (!currentChatId) {
        throw new Error('No chat selected');
      }
      const message: MessageType = {
        role: 'user',
        content: messageContent,
        created_by: 'user',
        type: 'text',
      };
      // Send message to the API
      await sendMessage(currentChatId, message);
      // Add message to local state
      setMessages([...messages, message]);

      // Generate chat response
      const response = await generateChatResponse(currentChatId);
      setMessages([...messages, message, ...response]);
    } catch (error) {
      console.error('Error sending message or generating response:', error);
    }
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar pastChats={pastChats} handleSelectChat={handleSelectChat} agents={agents} />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', mb: 8 }}>
          <Typography variant="h4" gutterBottom>
            Chat with Alice
          </Typography>
          <Chat messages={messages} />
        </Box>
        <Box sx={{ position: 'fixed', bottom: 0, left: 240, right: 0, p: 2, backgroundColor: 'white', zIndex: 1, borderTop: '1px solid #ccc' }}>
          <ChatInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            lastMessage={lastMessage}
            chatSelected={!!currentChatId} // pass the boolean value
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ChatAlice;

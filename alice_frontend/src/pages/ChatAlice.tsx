import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import Chat from '../components/Chat';
import Sidebar from '../components/Sidebar';
import ChatInput from '../components/ChatInput';
import { MessageType } from '../utils/types';

interface PastChat {
  id: number;
  name: string;
}

const ChatAlice: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [pastChats] = useState<PastChat[]>([
    { id: 1, name: 'Chat 1' },
    { id: 2, name: 'Chat 2' },
  ]);

  const handleSendMessage = () => {
    const message: MessageType = {
      role: 'user',
      content: newMessage,
      created_by: 'user',
      step: `${messages.length + 1}`,
      assistant_name: 'Alice',
      context: {},
    };
    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleSelectChat = (chat: PastChat) => {
    setMessages([]); // Reset messages for simplicity
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar pastChats={pastChats} handleSelectChat={handleSelectChat} />
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
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ChatAlice;

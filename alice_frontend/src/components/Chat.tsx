import React from 'react';
import { Box } from '@mui/material';
import Message from './Message';
import { MessageType } from '../utils/types';

interface ChatProps {
  messages: MessageType[];
}

const Chat: React.FC<ChatProps> = ({ messages }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '60vh',
        overflowY: 'auto',
        p: 2,
      }}
    >
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
    </Box>
  );
};

export default Chat;
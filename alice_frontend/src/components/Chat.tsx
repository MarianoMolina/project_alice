import React from 'react';
import { Box } from '@mui/material';
import Message from './Message';
import { ChatProps } from '../utils/types';

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
        message && message.content ? 
          <Message key={index} message={message} /> : 
          null
      ))}
    </Box>
  );
};

export default Chat;
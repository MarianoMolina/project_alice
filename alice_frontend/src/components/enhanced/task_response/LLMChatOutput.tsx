import React from 'react';
import { Box } from '@mui/material';
import Message from '../chat/Message';
import { MessageType } from '../../../utils/ChatTypes';

interface LLMChatOutputProps {
  message: MessageType;
}

export const LLMChatOutput: React.FC<LLMChatOutputProps> = ({ message }) => (
  <Box>
    <Message message={message} />
  </Box>
);
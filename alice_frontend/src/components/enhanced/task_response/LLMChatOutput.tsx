import React from 'react';
import { Box } from '@mui/material';
import Message from '../common/message/Message';
import { MessageType } from '../../../types/MessageTypes';

interface LLMChatOutputProps {
  message: MessageType;
}

export const LLMChatOutput: React.FC<LLMChatOutputProps> = ({ message }) => (
  <Box>
    <Message message={message} />
  </Box>
);
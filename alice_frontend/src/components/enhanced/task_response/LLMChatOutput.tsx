import React from 'react';
import { Box } from '@mui/material';
import { MessageType } from '../../../types/MessageTypes';
import EnhancedMessage from '../message/message/EnhancedMessage';

interface LLMChatOutputProps {
  message: MessageType;
}

export const LLMChatOutput: React.FC<LLMChatOutputProps> = ({ message }) => (
  <Box>
    <EnhancedMessage mode={'detail'} fetchAll={false} itemId={message._id} />
  </Box>
);
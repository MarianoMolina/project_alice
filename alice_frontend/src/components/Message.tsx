import React from 'react';
import { Box, Typography } from '@mui/material';

interface MessageProps {
  message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_by: 'user' | 'llm';
    step?: string;
    assistant_name?: string;
    context?: Record<string, any>;
  };
}

const Message: React.FC<MessageProps> = ({ message }) => {
  return (
    <Box
      sx={{
        mb: 1,
        p: 1,
        borderRadius: 1,
        backgroundColor:
          message.role === 'user'
            ? 'primary.light'
            : message.role === 'assistant'
            ? 'secondary.light'
            : 'grey.300',
      }}
    >
      {message.assistant_name && (
        <Typography variant="caption" color="textSecondary">
          {message.assistant_name}
        </Typography>
      )}
      <Typography variant="body1">{message.content}</Typography>
      <Typography variant="body2" color="textSecondary">
        {message.created_by}
      </Typography>
      {message.step && (
        <Typography variant="caption" color="textSecondary">
          Step: {message.step}
        </Typography>
      )}
      {message.context && (
        <Typography variant="caption" color="textSecondary">
          Context: {JSON.stringify(message.context)}
        </Typography>
      )}
    </Box>
  );
};

export default Message;

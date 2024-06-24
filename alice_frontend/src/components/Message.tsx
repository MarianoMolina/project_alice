import React from 'react';
import { Box, Typography } from '@mui/material';
import { MessageProps } from '../utils/types';

const Message: React.FC<MessageProps> = ({ message }) => {
  // Function to safely get the creator's name
  const getCreatorName = (createdBy: any) => {
    if (typeof createdBy === 'string') return createdBy;
    if (createdBy && typeof createdBy === 'object' && 'name' in createdBy) {
      return createdBy.name;
    }
    return 'Unknown';
  };

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
        {getCreatorName(message.created_by)}
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
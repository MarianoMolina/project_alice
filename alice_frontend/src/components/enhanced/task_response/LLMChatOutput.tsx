import React from 'react';
import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { MessageType } from '../../../utils/ChatTypes';

interface LLMChatOutputProps {
  content: MessageType[];
}

export const LLMChatOutput: React.FC<LLMChatOutputProps> = ({ content }) => {
  return (
    <List>
      {content.map((message, index) => (
        <ListItem key={index}>
          <ListItemText
            primary={
              <Typography variant="subtitle2">
                {message.role}{message.assistant_name ? ` (${message.assistant_name})` : ''}:
              </Typography>
            }
            secondary={message.content}
          />
        </ListItem>
      ))}
    </List>
  );
};
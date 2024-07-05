import React from 'react';
import { Box, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import useStyles from './MessageStyles';
import { MessageType, MessageProps } from '../../utils/ChatTypes';

const Message: React.FC<MessageProps> = ({ message }) => {
  const classes = useStyles();

  const getCreatorName = (message: MessageType) => {
    const createdBy = message.created_by;
    const asisstantName = message.assistant_name;
    const role = message.role;
    const typeMsg = message.type;
    if (typeMsg === 'TaskResponse') return 'Task Response';
    if (role === 'assistant') {
      if (asisstantName) return asisstantName;
      return "Assistant"
    }
    if (role === 'user') {
      if (createdBy) {
        if (typeof createdBy === 'string') return "User";
        if (createdBy && typeof createdBy === 'object' && 'name' in createdBy) return createdBy.name;
      }
      return "User"
    }
  };

  const getMessageClass = () => {
    switch (message.role) {
      case 'user':
        return classes.userMessage;
      case 'assistant':
        return classes.assistantMessage;
      default:
        return classes.otherMessage;
    }
  };

  return (
    <Box className={`${classes.message} ${getMessageClass()}`}>
      <Typography variant="caption" className={classes.assistantName}>
        {message.assistant_name || getCreatorName(message)}
      </Typography>
      <ReactMarkdown className={classes.markdownText}>{message.content}</ReactMarkdown>
      {message.step && (
        <Typography variant="caption" className={classes.stepContext}>
          Step: {message.step}
        </Typography>
      )}
      {message.context && (
        <Typography variant="caption" className={classes.stepContext}>
          Context: {JSON.stringify(message.context)}
        </Typography>
      )}
    </Box>
  );
};
export default Message;
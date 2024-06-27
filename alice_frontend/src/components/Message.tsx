import React from 'react';
import { Box, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { MessageProps } from '../utils/types';
import useStyles from './MessageStyles';

const Message: React.FC<MessageProps> = ({ message }) => {
  const classes = useStyles();

  const getCreatorName = (createdBy: any) => {
    if (typeof createdBy === 'string') return createdBy;
    if (createdBy && typeof createdBy === 'object' && 'name' in createdBy) {
      return createdBy.name;
    }
    return 'Unknown';
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
        {message.assistant_name || getCreatorName(message.created_by)}
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
      {/* <Typography variant="body2" className={classes.creator}>
        {getCreatorName(message.created_by)}
      </Typography> */}
export default Message;
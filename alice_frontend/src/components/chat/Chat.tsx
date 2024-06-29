import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import Message from './Message';
import { ChatProps } from '../../utils/types';
import useStyles from '../../styles/ChatStyles';

interface ExtendedChatProps extends ChatProps {
  isGenerating: boolean;
  onRequestResponse: () => void;
  onRegenerateResponse: () => void;
  chatSelected: boolean;
}

const Chat: React.FC<ExtendedChatProps> = ({
  messages,
  isGenerating,
  onRequestResponse,
  onRegenerateResponse,
  chatSelected
}) => {
  const classes = useStyles();
  const lastMessage = messages[messages.length - 1];

  const renderActionButton = () => {
    if (isGenerating) {
      return <Button disabled>Generating...</Button>;
    }
    if (lastMessage && lastMessage.role === 'user') {
      return <Button onClick={onRequestResponse}>Request Response</Button>;
    }
    if (lastMessage && lastMessage.role === 'assistant') {
      return <Button onClick={onRegenerateResponse}>Regenerate Response</Button>;
    }
    return null;
  };

  return (
    <Box className={classes.chatContainer}>
      {messages.map((message, index) => (
        message && message.content ?
          <Message key={index} message={message} /> :
          null
      ))}
      {!chatSelected && (
        <Typography variant="h6">Please select a chat to start chatting with Alice.</Typography>
      )}
      <Box className={classes.actionButtonContainer}>
        {renderActionButton()}
      </Box>
    </Box>
  );
};

export default Chat;
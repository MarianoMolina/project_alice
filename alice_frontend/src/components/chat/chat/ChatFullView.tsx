import React, { useRef, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { ChatComponentProps } from '../../../utils/ChatTypes';
import Message from '../Message';
import useStyles from '../ChatStyles';
import { useChat } from '../../../context/ChatContext';

interface ChatFullViewProps extends ChatComponentProps {
  isGenerating?: boolean;
  generateResponse?: () => void;
  handleRegenerateResponse?: () => void;
}

const ChatFullView: React.FC<ChatFullViewProps> = ({
  item,
  showRegenerate,
}) => {
  const classes = useStyles();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isGenerating, generateResponse, handleRegenerateResponse } = useChat();
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [item?.messages]);

  if (!item) {
    return null;
  }

  const renderActionButton = () => {
    if (isGenerating) {
      return <Button disabled>Generating...</Button>;
    }
    const lastMessage = item.messages[item.messages.length - 1];
    if (lastMessage && lastMessage.role === 'user' && generateResponse) {
      return <Button onClick={generateResponse}>Request Response</Button>;
    }
    if (lastMessage && lastMessage.role === 'assistant' && handleRegenerateResponse) {
      return <Button onClick={handleRegenerateResponse}>Regenerate Response</Button>;
    }
    return null;
  };

  return (
    <Box className={classes.fullChatView}>
      <Box className={classes.messagesContainer}>
        {item.messages && item.messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
      </Box>
      {showRegenerate &&
        <Box className={classes.actionButtonContainer}>
          {renderActionButton()}
        </Box>
      }
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatFullView;
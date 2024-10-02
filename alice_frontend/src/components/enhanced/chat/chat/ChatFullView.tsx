import React, { useRef, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { ChatComponentProps } from '../../../../types/ChatTypes';
import useStyles from '../ChatStyles';
import { useChat } from '../../../../contexts/ChatContext';
import PlaceholderSkeleton from '../../../ui/placeholder_skeleton/PlaceholderSkeleton';
import EnhancedMessage from '../../message/message/EnhancedMessage';

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
        {item.messages && item.messages.length > 0 ? (
          item.messages.map((message, index) => (
            <EnhancedMessage 
              key={message._id || index} 
              mode={'detail'} 
              fetchAll={false} 
              itemId={message._id} 
            />
          ))
        ) : (
          <Box className={classes.emptyMessagesContainer}>
            <PlaceholderSkeleton mode="chat" text='No messages yet. Send your first message to start the conversation.' className={classes.skeletonContainer} />
          </Box>
        )}
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

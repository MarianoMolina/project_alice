import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Button, Tooltip } from '@mui/material';
import { useChat } from '../../../../contexts/ChatContext';
import PlaceholderSkeleton from '../../../ui/placeholder_skeleton/PlaceholderSkeleton';
import MessageFullView from '../../message/message/MessageFullView';
import useStyles from '../ChatStyles';

interface ChatMessagesFullViewProps {
  showRegenerate?: boolean;
}
const ChatMessagesFullView: React.FC<ChatMessagesFullViewProps> = React.memo(({
  showRegenerate = true,
}) => {
  const classes = useStyles();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const { isGenerating, generateResponse, handleRegenerateResponse, currentChat } = useChat();

  const scrollToBottom = useCallback(() => {
    if (shouldScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShouldScroll(false);
    }
  }, [shouldScroll]);

  useEffect(() => {
    setShouldScroll(true);
  }, [currentChat?.messages]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const renderActionButton = useCallback(() => {
    if (isGenerating) {
      return <Button disabled>Generating...</Button>;
    }
    const lastMessage = currentChat?.messages[currentChat?.messages.length - 1];
    if (lastMessage && lastMessage.role === 'user' && generateResponse) {
      return (
        <Tooltip title="Request a new response from the assistant based on the last message">
          <Button variant='contained' onClick={generateResponse}>Request Response</Button>
        </Tooltip>
      );
    }
    if (lastMessage && lastMessage.role === 'assistant' && handleRegenerateResponse) {
      return (
        <Tooltip title="Remove the last assistant reply and generate a new response">
          <Button variant='contained' onClick={handleRegenerateResponse}>Regenerate Response</Button>
        </Tooltip>
      );
    }
    return null;
  }, [isGenerating, currentChat?.messages, generateResponse, handleRegenerateResponse]);

  const memoizedMessages = useMemo(() => (
    currentChat?.messages.map((message) => (
      <MessageFullView
        key={message._id}
        mode={'view'}
        item={message}
        items={null}
        onChange={() => {}}
        handleSave={async () => undefined}
      />
    ))
  ), [currentChat?.messages]);

  return (
    <Box className={classes.fullChatView}>
      <Box className={classes.messagesContainer}>
        {currentChat?.messages && currentChat?.messages.length > 0 ? (
          memoizedMessages
        ) : (
          <Box className={classes.emptyMessagesContainer}>
            <PlaceholderSkeleton
              mode="chat"
              text='No messages yet. Send your first message to start the conversation.'
              className={classes.skeletonContainer}
            />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>
      {showRegenerate && (
        <Box className={classes.actionButtonContainer}>
          {renderActionButton()}
        </Box>
      )}
    </Box>
  );
});

ChatMessagesFullView.displayName = 'ChatMessagesFullView';

export default ChatMessagesFullView;
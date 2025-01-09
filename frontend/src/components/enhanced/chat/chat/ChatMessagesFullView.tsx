import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { useChat } from '../../../../contexts/ChatContext';
import PlaceholderSkeleton from '../../../ui/placeholder_skeleton/PlaceholderSkeleton';
import MessageFullView from '../../message/message/MessageFullView';
import useStyles from '../ChatStyles';

interface ChatMessagesFullViewProps {
}

const ChatMessagesFullView: React.FC<ChatMessagesFullViewProps> = React.memo(() => {
  const classes = useStyles();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const { currentChat } = useChat();

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

  const memoizedMessages = useMemo(() => (
    currentChat?.messages.map((message) => (
      <MessageFullView
        key={message._id}
        mode={'view'}
        item={message}
        items={null}
        onChange={() => { }}
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
    </Box>
  );
});

ChatMessagesFullView.displayName = 'ChatMessagesFullView';

export default ChatMessagesFullView;
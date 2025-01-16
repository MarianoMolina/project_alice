import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { useChat } from '../../../../contexts/ChatContext';
import PlaceholderSkeleton from '../../../ui/placeholder_skeleton/PlaceholderSkeleton';
import MessageFullView from '../../message/message/MessageFullView';
import useStyles from '../ChatStyles';

interface ChatThreadFullViewProps {
}

const ChatThreadFullView: React.FC<ChatThreadFullViewProps> = React.memo(() => {
  const classes = useStyles();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const { currentThread } = useChat();

  const scrollToBottom = useCallback(() => {
    if (shouldScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShouldScroll(false);
    }
  }, [shouldScroll]);

  useEffect(() => {
    setShouldScroll(true);
  }, [currentThread?.messages]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const memoizedMessages = useMemo(() => (
    currentThread?.messages.map((message) => (
      <MessageFullView
        key={message._id}
        mode={'view'}
        item={message}
        items={null}
        onChange={() => { }}
        handleSave={async () => undefined}
      />
    ))
  ), [currentThread?.messages]);

  return (
    <Box className={classes.fullChatView}>
      <Box className={classes.messagesContainer}>
        {currentThread?.messages && currentThread?.messages.length > 0 ? (
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

ChatThreadFullView.displayName = 'ChatThreadFullView';

export default ChatThreadFullView;
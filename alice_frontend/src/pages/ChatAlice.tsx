import React, { useState } from 'react';
import { Box } from '@mui/material';
import Chat from '../components/chat/Chat';
import Sidebar from '../components/chat/Sidebar';
import ChatInput from '../components/chat/ChatInput';
import NewChat from '../components/db_elements/NewChat';
import { useChat } from '../context/ChatContext';
import useStyles from '../styles/ChatAliceStyles';
import { CreateAliceChat } from '../utils/types';

const ChatAlice: React.FC = () => {
  const classes = useStyles();
  const {
    messages,
    newMessage,
    setNewMessage,
    pastChats,
    currentChatId,
    agents,
    isGenerating,
    handleSelectChat,
    handleSendMessage,
    generateResponse,
    handleRegenerateResponse,
    createNewChat,
    currentChat
  } = useChat();

  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const lastMessage = messages[messages.length - 1];

  const handleNewChatClick = () => {
    setIsNewChatModalOpen(true);
  };

  const handleNewChatCreated = async (chat: Partial<CreateAliceChat>) => {
    try {
      createNewChat(chat);
      setIsNewChatModalOpen(false);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  return (
    <Box className={classes.chatAliceContainer}>
      <Box className={classes.chatAliceSidebar}>
        <Sidebar
          pastChats={pastChats}
          handleSelectChat={handleSelectChat}
          handleNewChatClick={handleNewChatClick}
          agents={agents}
          currentChatId={currentChatId}
          currentChat={currentChat}
        />
      </Box>
      <Box className={classes.chatAliceMain}>
        <Box className={classes.chatAliceMessages}>
          <Chat
            messages={messages}
            isGenerating={isGenerating}
            onRequestResponse={generateResponse}
            onRegenerateResponse={handleRegenerateResponse}
            chatSelected={!!currentChatId}
          />
        </Box>
        <Box className={classes.chatAliceInput}>
          <ChatInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            lastMessage={lastMessage}
            chatSelected={!!currentChatId}
          />
        </Box>
      </Box>
      <NewChat
        open={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onChatCreated={handleNewChatCreated}
      />
    </Box>
  );
};

export default ChatAlice;
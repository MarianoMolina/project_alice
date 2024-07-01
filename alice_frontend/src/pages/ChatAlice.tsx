import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Chat from '../components/chat/Chat';
import Sidebar from '../components/chat/Sidebar';
import ChatInput from '../components/chat/ChatInput';
import { useChat } from '../context/ChatContext';
import useStyles from '../styles/ChatAliceStyles';
import { CreateAliceChat, AliceTask, TaskResponse } from '../utils/types';

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
    currentChat,
    addTasksToChat,
    addTaskResultsToChat,
    isTaskInChat,
    isTaskResultInChat,
    fetchAvailableTasks,
    fetchAvailableTaskResults
  } = useChat();

  const [availableTasks, setAvailableTasks] = useState<AliceTask[]>([]);
  const [availableTaskResults, setAvailableTaskResults] = useState<TaskResponse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const tasks = await fetchAvailableTasks();
      const taskResults = await fetchAvailableTaskResults();
      setAvailableTasks(tasks);
      setAvailableTaskResults(taskResults);
    };
    fetchData();
  }, [fetchAvailableTasks, fetchAvailableTaskResults]);

  const handleNewChatCreated = async (chat: Partial<CreateAliceChat>) => {
    try {
      return await createNewChat(chat);
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
          handleNewChatCreated={handleNewChatCreated}
          agents={agents}
          currentChatId={currentChatId}
          currentChat={currentChat}
          tasks={availableTasks}
          taskResults={availableTaskResults}
          onAddTasksToChat={addTasksToChat}
          onAddTaskResultsToChat={addTaskResultsToChat}
          isTaskInChat={isTaskInChat}
          isTaskResultInChat={isTaskResultInChat}
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
            lastMessage={messages[messages.length - 1]}
            chatSelected={!!currentChatId}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ChatAlice;
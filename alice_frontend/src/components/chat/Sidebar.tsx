import React, { useState } from 'react';
import { Box } from '@mui/material';
import VerticalMenu from './VerticalMenu';
import NewChat from '../db_elements/NewChat';
import ChatList from './ChatList';
import ChatDetails from './ChatDetails';
import FunctionList from './FunctionList';
import TaskResultList from './TaskResultList';
import useStyles from '../../styles/SidebarStyles';
import { AliceChat, AliceAgent, TaskResponse, AliceTask, CreateAliceChat } from '../../utils/types';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../../utils/constants';

interface SidebarProps {
  pastChats: AliceChat[];
  handleSelectChat: (chatId: string) => Promise<void>;
  handleNewChatCreated: (chat: Partial<CreateAliceChat>) => Promise<string | undefined>;
  agents: AliceAgent[];
  currentChatId: string | null;
  currentChat: AliceChat | null;
  tasks: AliceTask[];
  taskResults: TaskResponse[];
  onAddTasksToChat: (taskIds: string[]) => Promise<void>;
  onAddTaskResultsToChat: (taskResultIds: string[]) => Promise<void>;
  isTaskInChat: (taskId: string) => boolean;
  isTaskResultInChat: (taskResultId: string) => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  pastChats,
  handleSelectChat,
  handleNewChatCreated,
  agents,
  currentChatId,
  currentChat,
  tasks,
  taskResults,
  onAddTasksToChat,
  onAddTaskResultsToChat,
  isTaskInChat,
  isTaskResultInChat
}) => {
  const classes = useStyles();
  const [activeTab, setActiveTab] = useState<'newChat' | 'selectChat' | 'currentChat' | 'addFunctions' | 'addTaskResults'>('selectChat');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleTabChange = (newTab: 'newChat' | 'selectChat' | 'currentChat' | 'addFunctions' | 'addTaskResults') => {
    if (newTab === activeTab) {
      setIsExpanded(!isExpanded);
    } else {
      setActiveTab(newTab);
      setIsExpanded(true);
    }
  };

  const handleNewChat = async (chat: Partial<CreateAliceChat>) => {
    const chatId = await handleNewChatCreated(chat);
    if (!chatId) return;
    handleChatSelection(chatId);
  };

  const handleChatSelection = async (chatId: string) => {
    await handleSelectChat(chatId);
    setActiveTab('currentChat');
    setIsExpanded(true);
  };

  const handleAddTask = async (taskId: string) => {
    await onAddTasksToChat([taskId]);
  };

  const handleAddTaskResult = async (taskResultId: string) => {
    await onAddTaskResultsToChat([taskResultId]);
  };

  const renderContent = () => {
    if (!isExpanded) return null;

    switch (activeTab) {
      case 'newChat':
        return <NewChat onChatCreated={handleNewChat} />;
      case 'selectChat':
        return <ChatList pastChats={pastChats} handleSelectChat={handleChatSelection} />;
      case 'currentChat':
        return (
          <ChatDetails
            currentChat={currentChat}
            agents={agents}
            tasks={tasks}
            taskResults={taskResults}
            onAddTasksToChat={onAddTasksToChat}
            onAddTaskResultsToChat={onAddTaskResultsToChat}
            isTaskInChat={isTaskInChat}
            isTaskResultInChat={isTaskResultInChat}
          />
        );
      case 'addFunctions':
        return (
          <FunctionList
            tasks={tasks}
            onAddTask={handleAddTask}
            isTaskInChat={isTaskInChat}
          />
        );
      case 'addTaskResults':
        return (
          <TaskResultList
            taskResults={taskResults}
            onAddTaskResult={handleAddTaskResult}
            isTaskResultInChat={isTaskResultInChat}
          />
        );
    }
  };

  return (
    <Box 
      className={classes.sidebar}
      style={{ width: isExpanded ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH }}
    >
      <VerticalMenu
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCurrentChatDisabled={!currentChatId}
        isExpanded={isExpanded}
      />
      <Box className={classes.content}>
        {renderContent()}
      </Box>
    </Box>
  );
};

export default Sidebar;
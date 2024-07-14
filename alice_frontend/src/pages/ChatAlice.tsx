import React, { useState, useMemo } from 'react';
import { Box, Skeleton, Stack, Typography, Dialog } from '@mui/material';
import { Add, Chat, Info, Functions, Assignment } from '@mui/icons-material';
import { TaskResponse } from '../utils/TaskResponseTypes';
import { AliceTask } from '../utils/TaskTypes';
import { AliceChat } from '../utils/ChatTypes';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { useChat } from '../context/ChatContext';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import EnhancedChat from '../components/chat/chat/EnhancedChat';
import EnhancedTask from '../components/task/task/EnhancedTask';
import EnhancedTaskResponse from '../components/task_response/task_response/EnhancedTaskResponse';
import EnhancedAgent from '../components/agent/agent/EnhancedAgent';
import ChatInput from '../components/chat/ChatInput';
import useStyles from '../styles/ChatAliceStyles';

const ChatAlice: React.FC = () => {
  const classes = useStyles();
  const {
    messages,
    currentChatId,
    handleSelectChat,
    handleSendMessage,
    fetchChats,
    currentChat,
    setCurrentChatId,
    addTasksToChat,
    addTaskResultsToChat, 
    isTaskInChat,
    isTaskResultInChat,
  } = useChat();
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [selectedResult, setSelectedResult] = useState<TaskResponse | null>(null);
  const [isTaskResultDialogOpen, setIsTaskResultDialogOpen] = useState(false);

  const [ openAgentDialog, setOpenAgentDialog ] = useState(false);
  const [ selectedAgentId, setSelectedAgentId ] = useState<string | undefined>(undefined);

  const [ openChatDialog, setOpenChatDialog ] = useState(false);
  const [ selectedChatId, setSelectedChatId ] = useState<string | undefined>(undefined);
  
  const lastMessage = messages[messages.length - 1];

  const [activeTab, setActiveTab] = useState('selectChat');

  // Create a memoized key that changes when messages change
  const chatKey = useMemo(() => JSON.stringify(messages), [messages]);

  const handleNewChatCreated = async (chat: AliceChat) => {
    fetchChats();
    setCurrentChatId(chat?._id);
    setActiveTab('currentChat');
  };

  const selectChatId = async (chat: AliceChat) => {
    console.log('Selected chat:', chat);
    await handleSelectChat(chat._id);
    setActiveTab('currentChat');
  };

  const tabs = [
    { name: 'newChat', icon: Add },
    { name: 'selectChat', icon: Chat },
    { name: 'currentChat', icon: Info, disabled: !currentChatId },
    { name: 'addFunctions', icon: Functions, disabled: !currentChatId },
    { name: 'addTaskResults', icon: Assignment, disabled: !currentChatId },
  ];

  const checkAndAddTask = (task: AliceTask) => {
    if (task._id && !isTaskInChat(task._id)) {
      addTasksToChat([task._id]);
    }
  }
  const checkAndAddTaskResult = (taskResult: TaskResponse) => {
    if (taskResult._id && !isTaskResultInChat(taskResult._id)) {
      addTaskResultsToChat([taskResult._id]);
    }
  }
  const triggerTaskDialog = (task: AliceTask) => {
    triggerTaskDialogId(task._id)
  }

  const triggerTaskDialogId = (taskid?: string) => {
    setSelectedTaskId(taskid);
    setOpenTaskDialog(true);
  }

  const triggerAgentDialogId = (agentid?: string) => {
    setSelectedAgentId(agentid);
    setOpenAgentDialog(true);
  }

  const triggerTaskResultDialog = (taskResult: TaskResponse) => {
    setSelectedResult(taskResult);
    setIsTaskResultDialogOpen(true);
  }
  const handleCloseTaskResult = () => {
    setIsTaskResultDialogOpen(false);
    setSelectedResult(null);
  };

  const triggerChatDialog = (chat: AliceChat) => {
    setSelectedChatId(chat._id);
    setOpenChatDialog(true);
  };

  const renderSidebarContent = (tabName: string) => {
    switch (tabName) {
      case 'newChat':
        return <EnhancedChat
          mode="create"
          fetchAll={false}
          onSave={handleNewChatCreated}
        />;
      case 'selectChat':
        return <EnhancedChat
          mode="shortList"
          onView={triggerChatDialog}
          onInteraction={selectChatId}
          fetchAll={true}
          isInteractable={true}
        />;
      case 'currentChat':
        return (
          <EnhancedChat
            itemId={currentChat?._id}
            mode="card"
            fetchAll={false}
            handleTaskClick={triggerTaskDialogId}
            handleAgentClick={triggerAgentDialogId}
          />
        );
      case 'addFunctions':
        return (
          <EnhancedTask mode={'list'} fetchAll={true} onInteraction={checkAndAddTask} onView={triggerTaskDialog} />
        );
      case 'addTaskResults':
        return (
          <EnhancedTaskResponse mode={'list'} fetchAll={true} onView={triggerTaskResultDialog} onInteraction={checkAndAddTaskResult}/>
        );
      default:
        return null;
    }
  };

  return (
    <Box className={classes.chatAliceContainer}>
      <VerticalMenuSidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        renderContent={renderSidebarContent}
        expandedWidth={SIDEBAR_WIDTH}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
      />
      <Box className={classes.chatAliceMain}>
        <Box className={classes.chatAliceMessages}>
          {currentChat ? (
            <EnhancedChat
              key={chatKey}  // Add this line
              itemId={currentChat._id}
              mode="full"
              fetchAll={false}
              showRegenerate={true}
            />
          ) : (
            <Stack spacing={1}>
              <Typography variant="h6">Please select a chat to start chatting with Alice.</Typography>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="rectangular" height={80} />
              <Skeleton variant="circular" className={classes.right_circle} width={40} height={40} />
              <Skeleton variant="rounded" height={90} />
            </Stack>
          )}
        </Box>
        <Box className={classes.chatAliceInput}>
          <ChatInput
            handleSendMessage={handleSendMessage}
            lastMessage={lastMessage}
            chatSelected={!!currentChatId}
          />
        </Box>
        <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)}>
          {selectedTaskId && <EnhancedTask itemId={selectedTaskId} mode={'card'} fetchAll={false} />}
        </Dialog>
        <Dialog open={isTaskResultDialogOpen} onClose={handleCloseTaskResult} fullWidth maxWidth="md">
          {selectedResult && <EnhancedTaskResponse itemId={selectedResult._id} fetchAll={false} mode={'card'} />}
        </Dialog>
        <Dialog open={openAgentDialog} onClose={() => setOpenAgentDialog(false)}>
          {selectedAgentId && <EnhancedAgent itemId={selectedAgentId} mode={'card'} fetchAll={false} />}
        </Dialog>
        <Dialog open={openChatDialog} onClose={() => setOpenChatDialog(false)}>
          {selectedChatId && <EnhancedChat itemId={selectedChatId} mode={'card'} fetchAll={false} />}
        </Dialog>
      </Box>
    </Box>
  );
};

export default ChatAlice;
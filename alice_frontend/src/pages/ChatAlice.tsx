import React, { useState, useMemo, useCallback } from 'react';
import { Box, Skeleton, Stack, Typography, Dialog } from '@mui/material';
import { Add, Chat, Info, Functions, Assignment } from '@mui/icons-material';
import { TaskResponse } from '../utils/TaskResponseTypes';
import { AliceTask } from '../utils/TaskTypes';
import { AliceChat } from '../utils/ChatTypes';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { useChat } from '../context/ChatContext';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import EnhancedChat from '../components/enhanced/chat/chat/EnhancedChat';
import EnhancedTask from '../components/enhanced/task/task/EnhancedTask';
import EnhancedTaskResponse from '../components/enhanced/task_response/task_response/EnhancedTaskResponse';
import EnhancedAgent from '../components/enhanced/agent/agent/EnhancedAgent';
import ChatInput from '../components/enhanced/chat/ChatInput';
import useStyles from '../styles/ChatAliceStyles';
import EnhancedPrompt from '../components/enhanced/prompt/prompt/EnhancedPrompt';
import EnhancedModel from '../components/enhanced/model/model/EnhancedModel';
import EnhancedParameter from '../components/enhanced/parameter/parameter/EnhancedParameter';

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
  const [openChatCreateDialog, setOpenChatCreateDialog] = useState(false);
  const [openAgentDialog, setOpenAgentDialog] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
  const [openPromptDialog, setOpenPromptDialog] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>(undefined);
  const [openModelDialog, setOpenModelDialog] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(undefined);
  const [openParameterDialog, setOpenParameterDialog] = useState(false);
  const [selectParameterId, setSelectParameterId] = useState<string | undefined>(undefined);

  const [activeTab, setActiveTab] = useState('Select Chat');
  const [listKey, setListKey] = useState(0);

  const lastMessage = messages[messages.length - 1];

  const chatKey = useMemo(() => {
    return JSON.stringify(messages);
  }, [messages]);

  const handleNewChatCreated = async (chat: AliceChat) => {
    await fetchChats();
    setCurrentChatId(chat?._id);
    setActiveTab('Current Chat');
  };

  const selectChatId = async (chat: AliceChat) => {
    console.log('Selected chat:', chat);
    await handleSelectChat(chat._id);
    setActiveTab('Current Chat');
  };

  const handleCreateNew = useCallback(() => {
    console.log('Create new clicked');
    setOpenChatCreateDialog(true);
  }, []);

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName === 'Select Chat') {
      setListKey(prev => prev + 1);
    }
  };

  const actions = [
    {
      name: `Create ${activeTab}`,
      icon: Add,
      action: handleCreateNew,
      disabled: activeTab === 'Task Results'
    }
  ];

  const tabs = [
    { name: 'Select Chat', icon: Chat },
    { name: 'Current Chat', icon: Info, disabled: !currentChatId },
    { name: 'Add Functions', icon: Functions, disabled: !currentChatId },
    { name: 'Add TaskResults', icon: Assignment, disabled: !currentChatId },
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

  const triggerChatDialog = (chat: AliceChat) => {
    setSelectedChatId(chat._id);
    setOpenChatDialog(true);
  };

  const triggerPromptDialog = (promptId: string) => {
    setSelectedPromptId(promptId);
    setOpenPromptDialog(true);
  };

  const triggerModelDialog = (modelId: string) => {
    setSelectedModelId(modelId);
    setOpenModelDialog(true);
  };

  const triggerParameterDialog = (parameterId: string) => {
    setSelectParameterId(parameterId);
    setOpenParameterDialog(true);
  }

  const renderSidebarContent = (tabName: string) => {
    switch (tabName) {
      case 'Select Chat':
        return (
          <EnhancedChat
            key={listKey}
            mode="list"
            onView={triggerChatDialog}
            onInteraction={selectChatId}
            fetchAll={true}
            isInteractable={true}
          />
        );
      case 'Current Chat':
        return (
          <EnhancedChat
            itemId={currentChat?._id}
            mode="card"
            fetchAll={false}
            handleTaskClick={triggerTaskDialogId}
            handleAgentClick={triggerAgentDialogId}
          />
        );
      case 'Add Functions':
        return (
          <EnhancedTask 
            mode={'list'} 
            fetchAll={true} 
            onInteraction={checkAndAddTask} 
            onView={triggerTaskDialog} 
          />
        );
      case 'Add TaskResults':
        return (
          <EnhancedTaskResponse 
            mode={'list'} 
            fetchAll={true} 
            onView={triggerTaskResultDialog} 
            onInteraction={checkAndAddTaskResult} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box className={classes.chatAliceContainer}>
      <VerticalMenuSidebar
        actions={actions}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        renderContent={renderSidebarContent}
        expandedWidth={TASK_SIDEBAR_WIDTH}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
      />
      <Box className={classes.chatAliceMain}>
        <Box className={classes.chatAliceMessages}>
          {currentChat ? (
            <EnhancedChat
              key={chatKey}
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
          {selectedTaskId && <EnhancedTask itemId={selectedTaskId} mode={'card'} fetchAll={false} handleAgentClick={triggerAgentDialogId} handleModelClick={triggerModelDialog} handleTaskClick={triggerTaskDialogId} handlePromptClick={triggerPromptDialog}/>}
        </Dialog>
        <Dialog open={isTaskResultDialogOpen} onClose={() => setIsTaskResultDialogOpen(false)}>
          {selectedResult && <EnhancedTaskResponse itemId={selectedResult._id} fetchAll={false} mode={'card'} />}
        </Dialog>
        <Dialog open={openAgentDialog} onClose={() => setOpenAgentDialog(false)}>
          {selectedAgentId && <EnhancedAgent itemId={selectedAgentId} mode={'card'} fetchAll={false} handleModelClick={triggerModelDialog} handlePromptClick={triggerPromptDialog} />}
        </Dialog>
        <Dialog open={openChatDialog} onClose={() => setOpenChatDialog(false)}>
          {selectedChatId && <EnhancedChat itemId={selectedChatId} mode={'card'} fetchAll={false} handleTaskClick={triggerTaskDialogId} handleAgentClick={triggerAgentDialogId}/>}
        </Dialog>
        <Dialog open={openPromptDialog} onClose={() => setOpenPromptDialog(false)}>
          {selectedPromptId && <EnhancedPrompt itemId={selectedPromptId} mode={'card'} fetchAll={false} handleParameterClick={triggerParameterDialog} />}
        </Dialog>
        <Dialog open={openModelDialog} onClose={() => setOpenModelDialog(false)}>
          {selectedModelId && <EnhancedModel itemId={selectedModelId} mode={'card'} fetchAll={false} />}
        </Dialog>
        <Dialog open={openParameterDialog} onClose={() => setOpenParameterDialog(false)}>
          {selectParameterId && <EnhancedParameter itemId={selectParameterId} mode={'card'} fetchAll={false} />}
        </Dialog>
        <Dialog open={openChatCreateDialog} onClose={() => setOpenChatCreateDialog(false)}>
          <EnhancedChat
            mode="create"
            fetchAll={false}
            onSave={handleNewChatCreated}
          />
        </Dialog>
      </Box>
    </Box>
  );
};

export default ChatAlice;
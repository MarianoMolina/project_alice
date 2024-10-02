import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import { Add, Chat, Info, Functions, Assignment, AttachFile, Description, Message } from '@mui/icons-material';
import { TaskResponse } from '../types/TaskResponseTypes';
import { AliceTask } from '../types/TaskTypes';
import { AliceChat } from '../types/ChatTypes';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { useChat } from '../contexts/ChatContext';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import EnhancedChat from '../components/enhanced/chat/chat/EnhancedChat';
import EnhancedTask from '../components/enhanced/task/task/EnhancedTask';
import EnhancedTaskResponse from '../components/enhanced/task_response/task_response/EnhancedTaskResponse';
import ChatInput, { ChatInputRef } from '../components/enhanced/common/chat_input/ChatInput';
import useStyles from '../styles/ChatAliceStyles';
import PlaceholderSkeleton from '../components/ui/placeholder_skeleton/PlaceholderSkeleton';
import { useCardDialog } from '../contexts/CardDialogContext';
import EnhancedFile from '../components/enhanced/file/file/EnhancedFile';
import { FileReference } from '../types/FileTypes';
import EnhancedURLReference from '../components/enhanced/url_reference/url_reference/EnhancedURLReference';
import EnhancedMessage from '../components/enhanced/message/message/EnhancedMessage';

const ChatAlice: React.FC = () => {
  const classes = useStyles();
  const {
    messages,
    currentChatId,
    handleSelectChat,
    handleSendMessage,
    currentChat,
    addTaskToChat,
    isTaskInChat,
  } = useChat();
  const { selectCardItem, selectFlexibleItem } = useCardDialog();

  const [activeTab, setActiveTab] = useState('Select Chat');
  const [listKey, setListKey] = useState(0);

  const chatInputRef = useRef<ChatInputRef>(null);

  const lastMessage = messages[messages.length - 1];

  const chatKey = useMemo(() => {
    return JSON.stringify(messages);
  }, [messages]);

  const selectChatId = async (chat: AliceChat) => {
    console.log('Selected chat:', chat);
    await handleSelectChat(chat._id);
    setActiveTab('Current Chat');
  };

  const handleCreateNew = useCallback(() => {
    selectFlexibleItem('Chat', 'create');
  }, [selectFlexibleItem]);

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
    { name: 'Select Chat', icon: Chat, group: 'Chat' },
    { name: 'Current Chat', icon: Info, disabled: !currentChatId, group: 'Info'},
    { name: 'Add Functions', icon: Functions, disabled: !currentChatId, group: 'Info' },
    { name: 'Add File Reference', icon: AttachFile, disabled: !currentChatId, group: 'Ref' },
    { name: 'Add Message Reference', icon: Message, disabled: !currentChatId, group: 'Ref' },
    { name: 'Add Task Results', icon: Assignment, disabled: !currentChatId, group: 'Ref' },
    { name: 'Add URL Reference', icon: Description, disabled: !currentChatId, group: 'Ref' },
  ];

  const checkAndAddTask = (task: AliceTask) => {
    if (task._id && !isTaskInChat(task._id)) {
      addTaskToChat(task._id);
    }
  }

  const addFileReference = (file: FileReference) => {
    chatInputRef.current?.addFileReference(file);
  };

  const addTaskResponse = (taskResponse: TaskResponse) => {
    chatInputRef.current?.addTaskResponse(taskResponse);
  }

  const addURLReference = (urlReference: any) => {
    chatInputRef.current?.addURLReference(urlReference);
  }

  const addMessageReference = (message: any) => {
    chatInputRef.current?.addMessageReference(message);
  }

  const renderSidebarContent = (tabName: string) => {
    const handleProps = {
      handleAgentClick: (id: string) => selectCardItem('Agent', id),
      handleTaskClick: (id: string) => selectCardItem('Task', id),
      handleModelClick: (id: string) => selectCardItem('Model', id),
      handlePromptClick: (id: string) => selectCardItem('Prompt', id),
      handleParameterClick: (id: string) => selectCardItem('Parameter', id),
      handleAPIClick: (id: string) => selectCardItem('API', id),
      handleMessageClick: (id: string) => selectCardItem('Message', id),
      handleURLReferenceClick: (id: string) => selectCardItem('URLReference', id),
    };

    switch (tabName) {
      case 'Select Chat':
        return (
          <EnhancedChat
            key={listKey}
            mode="shortList"
            onView={(chat) => selectCardItem('Chat', chat._id)}
            onInteraction={selectChatId}
            fetchAll={true}
            isInteractable={true}
            {...handleProps}
          />
        );
      case 'Current Chat':
        return (
          <EnhancedChat
            itemId={currentChat?._id}
            mode="card"
            fetchAll={false}
            {...handleProps}
          />
        );
      case 'Add Functions':
        return (
          <EnhancedTask
            mode={'list'}
            fetchAll={true}
            onInteraction={checkAndAddTask}
            onView={(task) => task._id && selectCardItem('Task', task._id)}
            {...handleProps}
          />
        );
      case 'Add Task Results':
        return (
          <EnhancedTaskResponse
            mode={'list'}
            fetchAll={true}
            onView={(taskResult) => taskResult._id && selectCardItem('TaskResponse', taskResult._id)}
            onInteraction={addTaskResponse}
            {...handleProps}
          />
        );
      case 'Add File Reference':
        return (
          <EnhancedFile
            mode={'list'}
            fetchAll={true}
            onView={(file) => file._id && selectCardItem('File', file._id)}
            onInteraction={addFileReference}
            {...handleProps}
          />
        );
      case 'Add URL Reference':
        return (
          <EnhancedURLReference
            mode={'list'}
            fetchAll={true}
            onView={(urlReference) => urlReference._id && selectCardItem('URLReference', urlReference._id)}
            onInteraction={addURLReference}
            {...handleProps}
          />
        );
      case 'Add Message Reference':
        return (
          <EnhancedMessage
            mode={'list'}
            fetchAll={true}
            onView={(message) => message._id && selectCardItem('Message', message._id)}
            onInteraction={addMessageReference}
            {...handleProps}
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
            <PlaceholderSkeleton
              mode="chat"
              text='Select a chat to start chatting with Alice.'
            />
          )}
        </Box>
        <Box className={classes.chatAliceInput}>
          <ChatInput
            ref={chatInputRef}
            sendMessage={handleSendMessage}
            lastMessage={lastMessage}
            currentChatId={currentChatId}
            chatSelected={!!currentChatId}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ChatAlice;
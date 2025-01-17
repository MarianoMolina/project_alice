import React from 'react';
import { Box, Dialog } from '@mui/material';
import EnhancedTask from '../../enhanced/task/task/EnhancedTask';
import EnhancedTaskResponse from '../../enhanced/task_response/task_response/EnhancedTaskResponse';
import EnhancedChat from '../../enhanced/chat/chat/EnhancedChat';
import EnhancedPrompt from '../../enhanced/prompt/prompt/EnhancedPrompt';
import EnhancedModel from '../../enhanced/model/model/EnhancedModel';
import EnhancedParameter from '../../enhanced/parameter/parameter/EnhancedParameter';
import EnhancedAPI from '../../enhanced/api/api/EnhancedApi';
import EnhancedAgent from '../../enhanced/agent/agent/EnhancedAgent';
import EnhancedFile from '../../enhanced/file/file/EnhancedFile';
import EnhancedUserCheckpoint from '../../enhanced/user_checkpoint/user_checkpoint/EnhancedUserCheckpoint';
import EnhancedUserInteraction from '../../enhanced/user_interaction/user_interaction/EnhancedUserInteraction';
import EnhancedEmbeddingChunk from '../../enhanced/embedding_chunk/embedding_chunk/EnhancedEmbeddingChunk';
import EnhancedDataCluster from '../../enhanced/data_cluster/data_cluster/EnhancedDataCluster';
import EnhancedToolCall from '../../enhanced/tool_calls/tool_calls/EnhancedToolCall';
import EnhancedCodeExecution from '../../enhanced/code_execution/code_execution/EnhancedCodeExecution';
import EnhancedAPIConfig from '../../enhanced/api_config/api_config/EnhancedAPIConfig';
import EnhancedMessage from '../../enhanced/message/message/EnhancedMessage';
import EnhancedEntityReference from '../../enhanced/entity_reference/entity_reference/EnhancedEntityReference';
import EnhancedChatThread from '../../enhanced/chat_thread/chat_thread/EnhancedChat';
import AgentCardView from '../../enhanced/agent/agent/AgentCardView';
import TaskCardView from '../../enhanced/task/task/TaskCardView';
import TaskResponseCardView from '../../enhanced/task_response/task_response/TaskResponseCardView';
import ChatCardView from '../../enhanced/chat/chat/ChatCardView';
import PromptCardView from '../../enhanced/prompt/prompt/PromptCardView';
import ModelCardView from '../../enhanced/model/model/ModelCardView';
import EntityReferenceCardView from '../../enhanced/entity_reference/entity_reference/EntityReferenceCardView';
import ParameterCardView from '../../enhanced/parameter/parameter/ParameterCardView';
import FileCardView from '../../enhanced/file/file/FileCardView';
import UserCheckpointCardView from '../../enhanced/user_checkpoint/user_checkpoint/UserCheckpointCardView';
import UserInteractionCardView from '../../enhanced/user_interaction/user_interaction/UserInteractionCardView';
import EmbeddingChunkCardView from '../../enhanced/embedding_chunk/embedding_chunk/EmbeddingChunkCardView';
import DataClusterCardView from '../../enhanced/data_cluster/data_cluster/DataClusterCardView';
import ApiCardView from '../../enhanced/api/api/ApiCardView';
import ChatThreadCardView from '../../enhanced/chat_thread/chat_thread/ChatThreadCardView';
import ToolCallCardView from '../../enhanced/tool_calls/tool_calls/ToolCallCardView';
import CodeExecutionCardView from '../../enhanced/code_execution/code_execution/CodeExecutionCardView';
import APIConfigCardView from '../../enhanced/api_config/api_config/APIConfigCardView';
import MessageCardView from '../../enhanced/message/message/MessageCardView';
import { useDialog } from '../../../contexts/DialogContext';
import { CollectionPopulatedType } from '../../../types/CollectionTypes';
import { AliceAgent } from '../../../types/AgentTypes';
import { PopulatedTask } from '../../../types/TaskTypes';
import { AliceModel } from '../../../types/ModelTypes';
import { Prompt } from '../../../types/PromptTypes';
import { ParameterDefinition } from '../../../types/ParameterTypes';
import { API } from '../../../types/ApiTypes';
import { PopulatedMessage } from '../../../types/MessageTypes';
import { PopulatedFileReference } from '../../../types/FileTypes';
import { PopulatedEntityReference } from '../../../types/EntityReferenceTypes';
import { UserCheckpoint } from '../../../types/UserCheckpointTypes';
import { PopulatedUserInteraction } from '../../../types/UserInteractionTypes';
import { EmbeddingChunk } from '../../../types/EmbeddingChunkTypes';
import { PopulatedDataCluster } from '../../../types/DataClusterTypes';
import { PopulatedToolCall } from '../../../types/ToolCallTypes';
import { PopulatedCodeExecution } from '../../../types/CodeExecutionTypes';
import { APIConfig } from '../../../types/ApiConfigTypes';
import Logger from '../../../utils/Logger';
import { PopulatedChatThread } from '../../../types/ChatThreadTypes';

const EnhancedCardDialog: React.FC = () => {
  const {
    selectedCardItem,
    selectedCardItemType,
    closeCardDialog,
    isCardDialogOpen,
    cardDialogZIndex,
    selectCardItem,
  } = useDialog();

  const renderDialogContent = () => {
    if (!selectedCardItem || !selectedCardItemType) return null;

    Logger.debug('EnhancedCardDialog', { selectedCardItem, selectedCardItemType });

    const handleProps = {
      handleAgentClick: (id: string, item?: AliceAgent) => selectCardItem('Agent', id, item),
      handleTaskClick: (id: string, item?: PopulatedTask) => selectCardItem('Task', id, item),
      handleModelClick: (id: string, item?: AliceModel) => selectCardItem('Model', id, item),
      handlePromptClick: (id: string, item?: Prompt) => selectCardItem('Prompt', id, item),
      handleParameterClick: (id: string, item?: ParameterDefinition) => selectCardItem('Parameter', id, item),
      handleAPIClick: (id: string, item?: API) => selectCardItem('API', id, item),
      handleFileClick: (id: string, item?: PopulatedFileReference) => selectCardItem('File', id, item),
      handleMessageClick: (id: string, item?: PopulatedMessage) => selectCardItem('Message', id, item),
      handleEntityReferenceClick: (id: string, item?: PopulatedEntityReference) => selectCardItem('EntityReference', id, item),
      handleUserCheckpointClick: (id: string, item?: UserCheckpoint) => selectCardItem('UserCheckpoint', id, item),
      handleUserInteractionClick: (id: string, item?: PopulatedUserInteraction) => selectCardItem('UserInteraction', id, item),
      handleEmbeddingChunkClick: (id: string, item?: EmbeddingChunk) => selectCardItem('EmbeddingChunk', id, item),
      handleDataClusterClick: (id: string, item?: PopulatedDataCluster) => selectCardItem('DataCluster', id, item),
      handleToolCallClick: (id: string, item?: PopulatedToolCall) => selectCardItem('ToolCall', id, item),
      handleCodeExecutionClick: (id: string, item?: PopulatedCodeExecution) => selectCardItem('CodeExecution', id, item),
      handleAPIConfigClick: (id: string, item?: APIConfig) => selectCardItem('APIConfig', id, item),
      handleChatThreadClick: (id: string, item?: PopulatedChatThread) => selectCardItem('ChatThread', id, item),
    };

    const commonProps = {
      mode: 'card' as const,
      fetchAll: false,
      ...handleProps,
    };

    const cardViewProps = {
      mode: 'view' as const,
      items: null,
      onChange: () => { },
      handleSave: async () => undefined,
      ...handleProps,
    };

    if ('_id' in selectedCardItem && typeof selectedCardItem._id === 'string' && Object.keys(selectedCardItem).length === 1) {
      Logger.debug('SWITCH EnhancedCardDialog', { selectedCardItem, selectedCardItemType });
      switch (selectedCardItemType) {
        case 'Agent':
          return <EnhancedAgent itemId={selectedCardItem._id} {...commonProps} />;
        case 'Task':
          return <EnhancedTask itemId={selectedCardItem._id} {...commonProps} />;
        case 'TaskResponse':
          return <EnhancedTaskResponse itemId={selectedCardItem._id} {...commonProps} />;
        case 'Chat':
          return <EnhancedChat itemId={selectedCardItem._id} {...commonProps} />;
        case 'Prompt':
          return <EnhancedPrompt itemId={selectedCardItem._id} {...commonProps} />;
        case 'Model':
          return <EnhancedModel itemId={selectedCardItem._id} {...commonProps} />;
        case 'Parameter':
          return <EnhancedParameter itemId={selectedCardItem._id} {...commonProps} />;
        case 'API':
          return <EnhancedAPI itemId={selectedCardItem._id} {...commonProps} />;
        case 'File':
          return <EnhancedFile itemId={selectedCardItem._id} {...commonProps} />;
        case 'Message':
          return <EnhancedMessage itemId={selectedCardItem._id} {...commonProps} />;
        case 'EntityReference':
          return <EnhancedEntityReference itemId={selectedCardItem._id} {...commonProps} />;
        case 'UserCheckpoint':
          return <EnhancedUserCheckpoint itemId={selectedCardItem._id} {...commonProps} />;
        case 'UserInteraction':
          return <EnhancedUserInteraction itemId={selectedCardItem._id} {...commonProps} />;
        case 'EmbeddingChunk':
          return <EnhancedEmbeddingChunk itemId={selectedCardItem._id} {...commonProps} />;
        case 'DataCluster':
          return <EnhancedDataCluster itemId={selectedCardItem._id} {...commonProps} />;
        case 'ToolCall':
          return <EnhancedToolCall itemId={selectedCardItem._id} {...commonProps} />;
        case 'CodeExecution':
          return <EnhancedCodeExecution itemId={selectedCardItem._id} {...commonProps} />;
        case 'APIConfig':
          return <EnhancedAPIConfig itemId={selectedCardItem._id} {...commonProps} />;
        case 'ChatThread':
          return <EnhancedChatThread itemId={selectedCardItem._id} {...commonProps} />;
        default:
          return null;
      }
    } else {
      Logger.debug('SWITCH 2 EnhancedCardDialog', { selectedCardItem, selectedCardItemType });
      switch (selectedCardItemType) {
        case 'Agent':
          return (
            <Box className="max-w-full">
              <AgentCardView item={selectedCardItem as CollectionPopulatedType['agents']} {...cardViewProps} />
            </Box>
          );
        case 'Task':
          return (
            <Box className="max-w-full">
              <TaskCardView item={selectedCardItem as CollectionPopulatedType['tasks']} {...cardViewProps} />
            </Box>
          );
        case 'TaskResponse':
          return (
            <Box className="max-w-full">
              <TaskResponseCardView item={selectedCardItem as CollectionPopulatedType['taskresults']} {...cardViewProps} />
            </Box>
          );
        case 'Chat':
          return (
            <Box className="max-w-full">
              <ChatCardView item={selectedCardItem as CollectionPopulatedType['chats']} {...cardViewProps} />
            </Box>
          );
        case 'Prompt':
          return (
            <Box className="max-w-full">
              <PromptCardView item={selectedCardItem as CollectionPopulatedType['prompts']} {...cardViewProps} />
            </Box>
          );
        case 'Model':
          return (
            <Box className="max-w-full">
              <ModelCardView item={selectedCardItem as CollectionPopulatedType['models']} {...cardViewProps} />
            </Box>
          );
        case 'Parameter':
          return (
            <Box className="max-w-full">
              <ParameterCardView item={selectedCardItem as CollectionPopulatedType['parameters']} {...cardViewProps} />
            </Box>
          );
        case 'API':
          return (
            <Box className="max-w-full">
              <ApiCardView item={selectedCardItem as CollectionPopulatedType['apis']} {...cardViewProps} />
            </Box>
          );
        case 'File':
          return (
            <Box className="max-w-full">
              <FileCardView item={selectedCardItem as CollectionPopulatedType['files']} {...cardViewProps} />
            </Box>
          );
        case 'Message':
          return (
            <Box className="max-w-full">
              <MessageCardView item={selectedCardItem as CollectionPopulatedType['messages']} {...cardViewProps} />
            </Box>
          );
        case 'EntityReference':
          return (
            <Box className="max-w-full">
              <EntityReferenceCardView item={selectedCardItem as CollectionPopulatedType['entityreferences']} {...cardViewProps} />;
            </Box>
          );
        case 'UserCheckpoint':
          return (
            <Box className="max-w-full">
              <UserCheckpointCardView item={selectedCardItem as CollectionPopulatedType['usercheckpoints']} {...cardViewProps} />
            </Box>
          );
        case 'UserInteraction':
          return (
            <Box className="max-w-full">
              <UserInteractionCardView item={selectedCardItem as CollectionPopulatedType['userinteractions']} {...cardViewProps} />
            </Box>
          );
        case 'EmbeddingChunk':
          return (
            <Box className="max-w-full">
              <EmbeddingChunkCardView item={selectedCardItem as CollectionPopulatedType['embeddingchunks']} {...cardViewProps} />
            </Box>
          );
        case 'DataCluster':
          return (
            <Box className="max-w-full">
              <DataClusterCardView item={selectedCardItem as CollectionPopulatedType['dataclusters']} {...cardViewProps} />
            </Box>
          );
        case 'ToolCall':
          return (
            <Box className="max-w-full">
              <ToolCallCardView item={selectedCardItem as CollectionPopulatedType['toolcalls']} {...cardViewProps} />
            </Box>
          );
        case 'CodeExecution':
          return (
            <Box className="max-w-full">
              <CodeExecutionCardView item={selectedCardItem as CollectionPopulatedType['codeexecutions']} {...cardViewProps} />
            </Box>
          );
        case 'APIConfig':
          return (
            <Box className="max-w-full">
              <APIConfigCardView item={selectedCardItem as CollectionPopulatedType['apiconfigs']} {...cardViewProps} />
            </Box>
          );
        case 'ChatThread':
          return (
            <Box className="max-w-full">
              <ChatThreadCardView item={selectedCardItem as CollectionPopulatedType['chatthreads']} {...cardViewProps} />
            </Box>
          );
        default:
          return null;
      }
    }
  };

  return (
    <Dialog
      open={isCardDialogOpen}
      onClose={closeCardDialog}
      maxWidth='xl'
      style={{ zIndex: cardDialogZIndex }}
    >
      {renderDialogContent()}
    </Dialog>
  );
};

export default EnhancedCardDialog;
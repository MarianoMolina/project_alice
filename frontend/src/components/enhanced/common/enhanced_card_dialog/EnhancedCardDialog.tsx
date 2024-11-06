import React from 'react';
import { Box, Dialog } from '@mui/material';
import EnhancedTask from '../../task/task/EnhancedTask';
import EnhancedTaskResponse from '../../task_response/task_response/EnhancedTaskResponse';
import EnhancedChat from '../../chat/chat/EnhancedChat';
import EnhancedPrompt from '../../prompt/prompt/EnhancedPrompt';
import EnhancedModel from '../../model/model/EnhancedModel';
import EnhancedParameter from '../../parameter/parameter/EnhancedParameter';
import EnhancedAPI from '../../api/api/EnhancedApi';
import EnhancedAgent from '../../agent/agent/EnhancedAgent';
import EnhancedFile from '../../file/file/EnhancedFile';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import { CollectionType } from '../../../../types/CollectionTypes';
import AgentCardView from '../../agent/agent/AgentCardView';
import TaskCardView from '../../task/task/TaskCardView';
import TaskResponseCardView from '../../task_response/task_response/TaskResponseCardView';
import ChatCardView from '../../chat/chat/ChatCardView';
import PromptCardView from '../../prompt/prompt/PromptCardView';
import ModelCardView from '../../model/model/ModelCardView';
import ParameterCardView from '../../parameter/parameter/ParameterCardView';
import FileCardView from '../../file/file/FileCardView';
import ApiCardView from '../../api/api/ApiCardView';
import EnhancedMessage from '../../message/message/EnhancedMessage';
import MessageCardView from '../../message/message/MessageCardView';
import { AliceAgent } from '../../../../types/AgentTypes';
import { AliceTask } from '../../../../types/TaskTypes';
import { AliceModel } from '../../../../types/ModelTypes';
import { Prompt } from '../../../../types/PromptTypes';
import { ParameterDefinition } from '../../../../types/ParameterTypes';
import { API } from '../../../../types/ApiTypes';
import { MessageType } from '../../../../types/MessageTypes';
import { FileReference } from '../../../../types/FileTypes';
import { URLReference } from '../../../../types/URLReferenceTypes';
import URLReferenceCardView from '../../url_reference/url_reference/URLReferenceCardView';
import EnhancedURLReference from '../../url_reference/url_reference/EnhancedURLReference';
import Logger from '../../../../utils/Logger';
import EnhancedUserCheckpoint from '../../user_checkpoint/user_checkpoint/EnhancedUserCheckpoint';
import EnhancedUserInteraction from '../../user_interaction/user_interaction/EnhancedUserInteraction';
import EnhancedEmbeddingChunk from '../../embedding_chunk/embedding_chunk/EnhancedEmbeddingChunk';
import EnhancedDataCluster from '../../data_cluster/data_cluster/EnhancedDataCluster';
import UserCheckpointCardView from '../../user_checkpoint/user_checkpoint/UserCheckpointCardView';
import UserInteractionCardView from '../../user_interaction/user_interaction/UserInteractionCardView';
import EmbeddingChunkCardView from '../../embedding_chunk/embedding_chunk/EmbeddingChunkCardView';
import DataClusterCardView from '../../data_cluster/data_cluster/DataClusterCardView';

const EnhancedCardDialog: React.FC = () => {
  const { selectedCardItem, selectedCardItemType, handleClose, selectCardItem } = useCardDialog();

  const renderDialogContent = () => {
    if (!selectedCardItem || !selectedCardItemType) return null;

    Logger.debug('EnhancedCardDialog', { selectedCardItem, selectedCardItemType });

    const handleProps = {
      handleAgentClick: (id: string, item?: AliceAgent) => selectCardItem('Agent', id, item),
      handleTaskClick: (id: string, item?: AliceTask) => selectCardItem('Task', id, item),
      handleModelClick: (id: string, item?: AliceModel) => selectCardItem('Model', id, item),
      handlePromptClick: (id: string, item?: Prompt) => selectCardItem('Prompt', id, item),
      handleParameterClick: (id: string, item?: ParameterDefinition) => selectCardItem('Parameter', id, item),
      handleAPIClick: (id: string, item?: API) => selectCardItem('API', id, item),
      handleFileClick: (id: string, item?: FileReference) => selectCardItem('File', id, item),
      handleMessageClick: (id: string, item?: MessageType) => selectCardItem('Message', id, item),
      handleURLReferenceClick: (id: string, item?: URLReference) => selectCardItem('URLReference', id, item),
      handleUserCheckpoint: (id: string) => selectCardItem('UserCheckpoint', id),
      handleUserInteraction: (id: string) => selectCardItem('UserInteraction', id),
      handleEmbeddingChunk: (id: string) => selectCardItem('EmbeddingChunk', id),
      handleDataCluster: (id: string) => selectCardItem('DataCluster', id),
    };

    const commonProps = {
      mode: 'card' as const,
      fetchAll: false,
      ...handleProps,
    };

    const cardViewProps = {
      mode: 'view' as const,
      items: null,
      onChange: () => {},
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
        case 'URLReference':
          return <EnhancedURLReference itemId={selectedCardItem._id} {...commonProps} />;
        case 'UserCheckpoint':
          return <EnhancedUserCheckpoint itemId={selectedCardItem._id} {...commonProps} />;
        case 'UserInteraction':
          return <EnhancedUserInteraction itemId={selectedCardItem._id} {...commonProps} />;
        case 'EmbeddingChunk':
          return <EnhancedEmbeddingChunk itemId={selectedCardItem._id} {...commonProps} />;
        case 'DataCluster':
          return <EnhancedDataCluster itemId={selectedCardItem._id} {...commonProps} />;
        default:
          return null;
      }
    } else {
      Logger.debug('SWITCH 2 EnhancedCardDialog', { selectedCardItem, selectedCardItemType });
      switch (selectedCardItemType) {
        case 'Agent':
          return (
            <Box className="max-w-full">
              <AgentCardView item={selectedCardItem as CollectionType['agents']} {...cardViewProps} />
            </Box>
          );
        case 'Task':
          return (
            <Box className="max-w-full">
              <TaskCardView item={selectedCardItem as CollectionType['tasks']} {...cardViewProps} />
            </Box>
          );
        case 'TaskResponse':
          return (
            <Box className="max-w-full">
              <TaskResponseCardView item={selectedCardItem as CollectionType['taskresults']} {...cardViewProps} />
            </Box>
          );
        case 'Chat':
          return (
            <Box className="max-w-full"> 
              <ChatCardView item={selectedCardItem as CollectionType['chats']} {...cardViewProps} />
            </Box>
          );
        case 'Prompt':
          return (
            <Box className="max-w-full">
              <PromptCardView item={selectedCardItem as CollectionType['prompts']} {...cardViewProps} />
            </Box>
          );
        case 'Model':
          return (
            <Box className="max-w-full">
              <ModelCardView item={selectedCardItem as CollectionType['models']} {...cardViewProps} />
            </Box>
          );
        case 'Parameter':
          return (
            <Box className="max-w-full">
              <ParameterCardView item={selectedCardItem as CollectionType['parameters']} {...cardViewProps} />
            </Box>
          );
        case 'API':
          return (
            <Box className="max-w-full">
              <ApiCardView item={selectedCardItem as CollectionType['apis']} {...cardViewProps} />
            </Box>
          );
        case 'File':
          return (
            <Box className="max-w-full">
              <FileCardView item={selectedCardItem as CollectionType['files']} {...cardViewProps} />
            </Box>
          );
        case 'Message':
          return (
            <Box className="max-w-full">
              <MessageCardView item={selectedCardItem as CollectionType['messages']} {...cardViewProps} />
            </Box>
          );
        case 'URLReference':
          return (
            <Box className="max-w-full">
              <URLReferenceCardView item={selectedCardItem as CollectionType['urlreferences']} {...cardViewProps} />;
            </Box>
          );
        case 'UserCheckpoint':
          return (
            <Box className="max-w-full">
              <UserCheckpointCardView item={selectedCardItem as CollectionType['usercheckpoints']} {...cardViewProps} />
            </Box>
          );
        case 'UserInteraction':
          return (
            <Box className="max-w-full">
              <UserInteractionCardView item={selectedCardItem as CollectionType['userinteractions']} {...cardViewProps} />
            </Box>
          );
        case 'EmbeddingChunk':
          return (
            <Box className="max-w-full">
              <EmbeddingChunkCardView item={selectedCardItem as CollectionType['embeddingchunks']} {...cardViewProps} />
            </Box>
          );
        case 'DataCluster':
          return (
            <Box className="max-w-full">
              <DataClusterCardView item={selectedCardItem as CollectionType['dataclusters']} {...cardViewProps} />
            </Box>
          );
        default:
          return null;
      }
    }
  };

  return (
    <Dialog open={!!selectedCardItem} onClose={handleClose} maxWidth='xl'>
      {renderDialogContent()}
    </Dialog>
  );
};

export default EnhancedCardDialog;
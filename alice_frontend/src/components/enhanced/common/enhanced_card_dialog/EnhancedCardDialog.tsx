import React from 'react';
import { Dialog } from '@mui/material';
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

const EnhancedCardDialog: React.FC = () => {
  const { selectedCardItem, selectedCardItemType, handleClose, selectCardItem } = useCardDialog();

  const renderDialogContent = () => {
    if (!selectedCardItem || !selectedCardItemType) return null;

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

    if ('_id' in selectedCardItem && typeof selectedCardItem._id === 'string') {
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
        default:
          return null;
      }
    } else {
      switch (selectedCardItemType) {
        case 'Agent':
          return <AgentCardView item={selectedCardItem as CollectionType['agents']} {...cardViewProps} />;
        case 'Task':
          return <TaskCardView item={selectedCardItem as CollectionType['tasks']} {...cardViewProps} />;
        case 'TaskResponse':
          return <TaskResponseCardView item={selectedCardItem as CollectionType['taskresults']} {...cardViewProps} />;
        case 'Chat':
          return <ChatCardView item={selectedCardItem as CollectionType['chats']} {...cardViewProps} />;
        case 'Prompt':
          return <PromptCardView item={selectedCardItem as CollectionType['prompts']} {...cardViewProps} />;
        case 'Model':
          return <ModelCardView item={selectedCardItem as CollectionType['models']} {...cardViewProps} />;
        case 'Parameter':
          return <ParameterCardView item={selectedCardItem as CollectionType['parameters']} {...cardViewProps} />;
        case 'API':
          return <ApiCardView item={selectedCardItem as CollectionType['apis']} {...cardViewProps} />;
        case 'File':
          return <FileCardView item={selectedCardItem as CollectionType['files']} {...cardViewProps} />;
        case 'Message':
          return <MessageCardView item={selectedCardItem as CollectionType['messages']} {...cardViewProps} />;
        case 'URLReference':
          return <URLReferenceCardView item={selectedCardItem as CollectionType['urlreferences']} {...cardViewProps} />;
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
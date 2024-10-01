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
  const { selectedItem, selectedItemType, handleClose, selectItem } = useCardDialog();

  const renderDialogContent = () => {
    if (!selectedItem || !selectedItemType) return null;

    const handleProps = {
      handleAgentClick: (id: string, item?: AliceAgent) => selectItem('Agent', id, item),
      handleTaskClick: (id: string, item?: AliceTask) => selectItem('Task', id, item),
      handleModelClick: (id: string, item?: AliceModel) => selectItem('Model', id, item),
      handlePromptClick: (id: string, item?: Prompt) => selectItem('Prompt', id, item),
      handleParameterClick: (id: string, item?: ParameterDefinition) => selectItem('Parameter', id, item),
      handleAPIClick: (id: string, item?: API) => selectItem('API', id, item),
      handleFileClick: (id: string, item?: FileReference) => selectItem('File', id, item),
      handleMessageClick: (id: string, item?: MessageType) => selectItem('Message', id, item),
      handleURLReferenceClick: (id: string, item?: URLReference) => selectItem('URLReference', id, item),
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

    if ('_id' in selectedItem && typeof selectedItem._id === 'string') {
      switch (selectedItemType) {
        case 'Agent':
          return <EnhancedAgent itemId={selectedItem._id} {...commonProps} />;
        case 'Task':
          return <EnhancedTask itemId={selectedItem._id} {...commonProps} />;
        case 'TaskResponse':
          return <EnhancedTaskResponse itemId={selectedItem._id} {...commonProps} />;
        case 'Chat':
          return <EnhancedChat itemId={selectedItem._id} {...commonProps} />;
        case 'Prompt':
          return <EnhancedPrompt itemId={selectedItem._id} {...commonProps} />;
        case 'Model':
          return <EnhancedModel itemId={selectedItem._id} {...commonProps} />;
        case 'Parameter':
          return <EnhancedParameter itemId={selectedItem._id} {...commonProps} />;
        case 'API':
          return <EnhancedAPI itemId={selectedItem._id} {...commonProps} />;
        case 'File':
          return <EnhancedFile itemId={selectedItem._id} {...commonProps} />;
        case 'Message':
          return <EnhancedMessage itemId={selectedItem._id} {...commonProps} />;
        case 'URLReference':
          return <EnhancedURLReference itemId={selectedItem._id} {...commonProps} />;
        default:
          return null;
      }
    } else {
      switch (selectedItemType) {
        case 'Agent':
          return <AgentCardView item={selectedItem as CollectionType['agents']} {...cardViewProps} />;
        case 'Task':
          return <TaskCardView item={selectedItem as CollectionType['tasks']} {...cardViewProps} />;
        case 'TaskResponse':
          return <TaskResponseCardView item={selectedItem as CollectionType['taskresults']} {...cardViewProps} />;
        case 'Chat':
          return <ChatCardView item={selectedItem as CollectionType['chats']} {...cardViewProps} />;
        case 'Prompt':
          return <PromptCardView item={selectedItem as CollectionType['prompts']} {...cardViewProps} />;
        case 'Model':
          return <ModelCardView item={selectedItem as CollectionType['models']} {...cardViewProps} />;
        case 'Parameter':
          return <ParameterCardView item={selectedItem as CollectionType['parameters']} {...cardViewProps} />;
        case 'API':
          return <ApiCardView item={selectedItem as CollectionType['apis']} {...cardViewProps} />;
        case 'File':
          return <FileCardView item={selectedItem as CollectionType['files']} {...cardViewProps} />;
        case 'Message':
          return <MessageCardView item={selectedItem as CollectionType['messages']} {...cardViewProps} />;
        case 'URLReference':
          return <URLReferenceCardView item={selectedItem as CollectionType['urlreferences']} {...cardViewProps} />;
        default:
          return null;
      }
    }
  };

  return (
    <Dialog open={!!selectedItem} onClose={handleClose} maxWidth='xl'>
      {renderDialogContent()}
    </Dialog>
  );
};

export default EnhancedCardDialog;
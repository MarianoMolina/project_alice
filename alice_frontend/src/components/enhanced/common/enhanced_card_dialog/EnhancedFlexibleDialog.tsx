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
import EnhancedMessage from '../../message/message/EnhancedMessage';
import EnhancedURLReference from '../../url_reference/url_reference/EnhancedURLReference';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import { ComponentMode } from '../../../../types/CollectionTypes';

const EnhancedFlexibleDialog: React.FC = () => {
  const { 
    selectedFlexibleItem, 
    selectedFlexibleItemType, 
    selectCardItem,
    flexibleDialogMode, 
    handleClose, 
    isDialogOpen,
    activeDialog
  } = useCardDialog();

  const renderDialogContent = () => {
    if (!selectedFlexibleItemType || !flexibleDialogMode || activeDialog !== 'flexible') return null;

    const handleProps = {
      handleAgentClick: (id: string) => selectCardItem('Agent', id),
      handleTaskClick: (id: string) => selectCardItem('Task', id),
      handleModelClick: (id: string) => selectCardItem('Model', id),
      handlePromptClick: (id: string) => selectCardItem('Prompt', id),
      handleParameterClick: (id: string) => selectCardItem('Parameter', id),
      handleAPIClick: (id: string) => selectCardItem('API', id),
      handleFileClick: (id: string) => selectCardItem('File', id),
      handleMessageClick: (id: string) => selectCardItem('Message', id),
      handleURLReferenceClick: (id: string) => selectCardItem('URLReference', id),
    };

    const commonProps = {
      mode: flexibleDialogMode as ComponentMode,
      fetchAll: false,
      onSave: handleClose,
      ...handleProps,
    };

    if (flexibleDialogMode === 'edit' as ComponentMode && selectedFlexibleItem && '_id' in selectedFlexibleItem) {
      switch (selectedFlexibleItemType) {
        case 'Agent':
          return <EnhancedAgent itemId={selectedFlexibleItem._id} {...commonProps} />;
        case 'Task':
          return <EnhancedTask itemId={selectedFlexibleItem._id} {...commonProps} />;
        case 'TaskResponse':
          return <EnhancedTaskResponse itemId={selectedFlexibleItem._id} {...commonProps} />;
        case 'Chat':
          return <EnhancedChat itemId={selectedFlexibleItem._id} {...commonProps} />;
        case 'Prompt':
          return <EnhancedPrompt itemId={selectedFlexibleItem._id} {...commonProps} />;
        case 'Model':
          return <EnhancedModel itemId={selectedFlexibleItem._id} {...commonProps} />;
        case 'Parameter':
          return <EnhancedParameter itemId={selectedFlexibleItem._id} {...commonProps} />;
        case 'API':
          return <EnhancedAPI itemId={selectedFlexibleItem._id} {...commonProps} />;
        case 'File':
          return <EnhancedFile itemId={selectedFlexibleItem._id} {...commonProps} />;
        case 'Message':
          return <EnhancedMessage itemId={selectedFlexibleItem._id} {...commonProps} />;
        case 'URLReference':
          return <EnhancedURLReference itemId={selectedFlexibleItem._id} {...commonProps} />;
        default:
          return null;
      }
    } else if (flexibleDialogMode === 'create') {
      switch (selectedFlexibleItemType) {
        case 'Agent':
          return <EnhancedAgent {...commonProps} />;
        case 'Task':
          return <EnhancedTask {...commonProps} />;
        case 'TaskResponse':
          return <EnhancedTaskResponse {...commonProps} />;
        case 'Chat':
          return <EnhancedChat {...commonProps} />;
        case 'Prompt':
          return <EnhancedPrompt {...commonProps} />;
        case 'Model':
          return <EnhancedModel {...commonProps} />;
        case 'Parameter':
          return <EnhancedParameter {...commonProps} />;
        case 'API':
          return <EnhancedAPI {...commonProps} />;
        case 'File':
          return <EnhancedFile {...commonProps} />;
        case 'Message':
          return <EnhancedMessage {...commonProps} />;
        case 'URLReference':
          return <EnhancedURLReference {...commonProps} />;
        default:
          return null;
      }
    }
    return null;
  };

  return (
    <Dialog open={isDialogOpen && activeDialog === 'flexible'} onClose={handleClose} maxWidth='xl'>
      {renderDialogContent()}
    </Dialog>
  );
};

export default EnhancedFlexibleDialog;
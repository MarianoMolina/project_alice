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
import { useCardDialog } from '../../../../context/CardDialogContext';

const EnhancedCardDialog: React.FC = () => {
  const { selectedItem, selectedItemType, handleClose, selectItem } = useCardDialog();

  const renderDialogContent = () => {
    if (!selectedItem || !selectedItemType) return null;

    const commonProps = {
      itemId: selectedItem._id,
      mode: 'card' as const,
      fetchAll: false,
    };

    const handleProps = {
      handleAgentClick: (id: string) => selectItem('Agent', id),
      handleTaskClick: (id: string) => selectItem('Task', id),
      handleModelClick: (id: string) => selectItem('Model', id),
      handlePromptClick: (id: string) => selectItem('Prompt', id),
      handleParameterClick: (id: string) => selectItem('Parameter', id),
      handleAPIClick: (id: string) => selectItem('API', id),
      handleFileClick: (id: string) => selectItem('File', id),
    };

    switch (selectedItemType) {
      case 'Agent':
        return <EnhancedAgent {...commonProps} {...handleProps} />;
      case 'Task':
        return <EnhancedTask {...commonProps} {...handleProps} />;
      case 'TaskResponse':
        return <EnhancedTaskResponse {...commonProps} {...handleProps} />;
      case 'Chat':
        return <EnhancedChat {...commonProps} {...handleProps} />;
      case 'Prompt':
        return <EnhancedPrompt {...commonProps} {...handleProps} />;
      case 'Model':
        return <EnhancedModel {...commonProps} {...handleProps} />;
      case 'Parameter':
        return <EnhancedParameter {...commonProps} {...handleProps} />;
      case 'API':
        return <EnhancedAPI {...commonProps} {...handleProps} />;
      case 'File':
        return <EnhancedFile {...commonProps} {...handleProps} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={!!selectedItem} onClose={handleClose} maxWidth='xl'>
      {renderDialogContent()}
    </Dialog>
  );
};

export default EnhancedCardDialog;
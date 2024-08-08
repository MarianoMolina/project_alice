import React from 'react';
import { Dialog } from '@mui/material';
import { useConfig } from '../../../../context/ConfigContext';
import EnhancedTask from '../../task/task/EnhancedTask';
import EnhancedTaskResponse from '../../task_response/task_response/EnhancedTaskResponse';
import EnhancedChat from '../../chat/chat/EnhancedChat';
import EnhancedPrompt from '../../prompt/prompt/EnhancedPrompt';
import EnhancedModel from '../../model/model/EnhancedModel';
import EnhancedParameter from '../../parameter/parameter/EnhancedParameter';
import EnhancedAPI from '../../api/api/EnhancedApi';
import EnhancedAgent from '../../agent/agent/EnhancedAgent';

const EnhancedCardDialogs: React.FC = () => {
  const {
    selectedItem,
    selectedItemType,
    setSelectedItem,
    setSelectedItemType,
    triggerItemDialog
  } = useConfig();

  const handleClose = () => {
    setSelectedItem(null);
    setSelectedItemType(null);
  };

  const renderDialogContent = () => {
    if (!selectedItem || !selectedItemType) return null;

    const commonProps = {
      itemId: selectedItem._id,
      mode: 'card' as const,
      fetchAll: false,
    };

    const handleProps = {
      handleAgentClick: (id: string) => triggerItemDialog('Agent', id),
      handleTaskClick: (id: string) => triggerItemDialog('Task', id),
      handleModelClick: (id: string) => triggerItemDialog('Model', id),
      handlePromptClick: (id: string) => triggerItemDialog('Prompt', id),
      handleParameterClick: (id: string) => triggerItemDialog('Parameter', id),
      handleAPIClick: (id: string) => triggerItemDialog('API', id),
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
      default:
        return null;
    }
  };

  return (
    <Dialog open={!!selectedItem} onClose={handleClose}>
      {renderDialogContent()}
    </Dialog>
  );
};

export default EnhancedCardDialogs;
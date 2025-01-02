import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useAuth } from '../../../../contexts/AuthContext';
import { useDialog } from '../../../../contexts/DialogContext';
import PromptParsedView from '../../prompt/PromptParsedView';

const PromptParsedDialog: React.FC = () => {
  const { user } = useAuth();
  const { 
    isPromptDialogOpen, 
    selectedPromptItem,
    selectedSystemPromptItem,
    promptInputs,
    systemPromptInputs,
    closePromptDialog,
    onPromptInputsChange,
    onSystemPromptInputsChange,
    promptDialogZIndex
  } = useDialog();
  const effectiveSystemInputs = selectedSystemPromptItem && 
    (!systemPromptInputs || !systemPromptInputs.user_data) && 
    user ? 
    { ...systemPromptInputs, user_data: user } : 
    systemPromptInputs || undefined;

  if (!selectedPromptItem) return null;

  let title = `Prompt: ${selectedPromptItem.name}` || 'Prompt Preview';
  if (selectedSystemPromptItem) {
    title += ` (System: ${selectedSystemPromptItem.name})`;
  }

  return (
    <Dialog
      open={isPromptDialogOpen}
      onClose={closePromptDialog}
      maxWidth="md"
      style={{ zIndex: promptDialogZIndex }}
      fullWidth
    >
      <DialogTitle>
        {title}
      </DialogTitle>
      <DialogContent>
        <PromptParsedView
          prompt={selectedPromptItem}
          systemPrompt={selectedSystemPromptItem || undefined}
          initialInputs={promptInputs || undefined}
          initialSystemInputs={effectiveSystemInputs}
          onChange={onPromptInputsChange}
          onSystemChange={onSystemPromptInputsChange}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PromptParsedDialog;
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useDialog } from '../../../context/DialogCustomContext';

const DialogComponent: React.FC = () => {
  const { dialogOptions, closeDialog } = useDialog();

  if (!dialogOptions) return null;

  const { title, content, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel } = dialogOptions;

  const handleConfirm = () => {
    onConfirm();
    closeDialog();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeDialog();
  };

  return (
    <Dialog open={!!dialogOptions} onClose={handleCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{content}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="primary">
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DialogComponent;
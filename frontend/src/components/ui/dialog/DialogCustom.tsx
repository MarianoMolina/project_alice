import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useDialog } from '../../../contexts/DialogCustomContext';

const DialogComponent: React.FC = () => {
  const { dialogOptions, closeDialog } = useDialog();

  if (!dialogOptions) return null;

  const { title, content, buttons } = dialogOptions;

  const handleButtonClick = (action: () => void) => {
    action();
    closeDialog();
  };

  return (
    <Dialog open={!!dialogOptions} onClose={closeDialog}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{content}</Typography>
      </DialogContent>
      <DialogActions>
        {buttons.map((button, index) => (
          <Button
            key={index}
            onClick={() => handleButtonClick(button.action)}
            color={button.color || 'primary'}
            variant={button.variant || 'text'}
          >
            {button.text}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};

export default DialogComponent;
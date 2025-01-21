import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ApiName } from '../../../../types/ApiTypes';
import APICapabilities from './ApiCapabilities';

interface APICapabilitiesDialogProps {
  open: boolean;
  onClose: () => void;
  apiName?: ApiName;
}

const APICapabilitiesDialog: React.FC<APICapabilitiesDialogProps> = ({
  open,
  onClose,
  apiName,
}) => {

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {apiName ? `${apiName} Capabilities` : 'API Capabilities'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <APICapabilities apiName={apiName} />
      </DialogContent>
    </Dialog>
  );
};

export default APICapabilitiesDialog;
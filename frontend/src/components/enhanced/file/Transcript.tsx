import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { MessageType } from '../../../types/MessageTypes';
import { useApi } from '../../../contexts/ApiContext';
import EnhancedMessage from '../message/message/EnhancedMessage';
import Logger from '../../../utils/Logger';
import { useDialog } from '../../../contexts/DialogCustomContext';

interface TranscriptProps {
  fileId: string;
  transcript?: MessageType;
  onTranscriptUpdate: (newTranscript: MessageType) => void;
}

const Transcript: React.FC<TranscriptProps> = ({ fileId, transcript, onTranscriptUpdate }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const { requestFileTranscript } = useApi();
  const { openDialog, closeDialog } = useDialog();

  const handleRequestTranscript = async () => {
    setIsRequesting(true);
    try {
      const newTranscript = await requestFileTranscript(fileId);
      onTranscriptUpdate(newTranscript);
    } catch (error) {
      Logger.error('Error requesting transcript:', error);
    } finally {
      setIsRequesting(false);
      closeDialog();
    }
  };

  const handleOpenDialog = () => {
    openDialog({
      title: 'Request Transcript',
      content: "An available model will be used to generate a transcript for this file. Do you want to proceed?",
      buttons: [
        {
          text: 'Cancel',
          action: closeDialog,
          color: 'error',
          variant: 'contained',
        },
        {
          text: isRequesting ? 'Requesting...' : 'Confirm',
          action: handleRequestTranscript,
          color: 'primary',
          variant: 'contained',
          disabled: isRequesting,
        }
      ],
    });
  }

  return (
    <Box>
      <Typography variant="h6">Transcript</Typography>
      {transcript ? (
        <EnhancedMessage mode={'detail'} fetchAll={false} itemId={transcript._id} />
      ) : (
        <Typography>No transcript available</Typography>
      )}
      <Button
        variant="outlined"
        onClick={() => handleOpenDialog()}
        disabled={isRequesting}
      >
        {transcript ? 'Request New Transcript' : 'Request Transcript'}
      </Button>
    </Box>
  );
};

export default Transcript;
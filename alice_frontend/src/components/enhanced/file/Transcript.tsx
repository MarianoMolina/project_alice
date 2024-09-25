import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import { MessageType } from '../../../types/ChatTypes';
import Message from '../common/message/Message';
import { useApi } from '../../../context/ApiContext';

interface TranscriptProps {
  fileId: string;
  transcript?: MessageType;
  onTranscriptUpdate: (newTranscript: MessageType) => void;
}

const Transcript: React.FC<TranscriptProps> = ({ fileId, transcript, onTranscriptUpdate }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { requestFileTranscript } = useApi();

  const handleRequestTranscript = async () => {
    setIsRequesting(true);
    try {
      const newTranscript = await requestFileTranscript(fileId);
      onTranscriptUpdate(newTranscript);
    } catch (error) {
      console.error('Error requesting transcript:', error);
    } finally {
      setIsRequesting(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6">Transcript</Typography>
      {transcript ? (
        <Message message={transcript} />
      ) : (
        <Typography>No transcript available</Typography>
      )}
      <Button
        variant="outlined"
        onClick={() => setIsDialogOpen(true)}
        disabled={isRequesting}
      >
        {transcript ? 'Request New Transcript' : 'Request Transcript'}
      </Button>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Request Transcript</DialogTitle>
        <DialogContent>
          <Typography>
            An available model will be used to generate a transcript for this file. 
            Do you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRequestTranscript} disabled={isRequesting}>
            {isRequesting ? 'Requesting...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transcript;
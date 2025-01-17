import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { PostAdd } from '@mui/icons-material';
import { useApi } from '../../../contexts/ApiContext';
import { useChat } from '../../../contexts/ChatContext';
import Logger from '../../../utils/Logger';
import CommonCardView from '../../common/enhanced_component/CardView';
import { ChatThread } from '../../../types/ChatThreadTypes';

interface CreateThreadInChatProps {
  open: boolean;
  onClose: () => void;
}

const CreateThreadInChat: React.FC<CreateThreadInChatProps> = ({ open, onClose }) => {
  const [threadName, setThreadName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createItem, updateItem } = useApi();
  const { currentChat, handleSelectChat } = useChat();

  const handleCreate = useCallback(async () => {
    if (!currentChat?._id) {
      Logger.error('No current chat selected');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the new thread
      const newThread = await createItem('chatthreads', {
        name: threadName || 'New Thread',
        messages: [],
      });

      // Update the chat with the new thread
      const updatedThreads = [...(currentChat.threads || []), newThread];
      await updateItem('chats', currentChat._id, { threads: updatedThreads as ChatThread[]});
      
      // Refresh the chat to get the updated data
      await handleSelectChat(currentChat._id);
      
      onClose();
    } catch (error) {
      Logger.error('Error creating thread:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [threadName, currentChat, createItem, updateItem, handleSelectChat, onClose]);

  const handleCancel = useCallback(() => {
    setThreadName('');
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
    >
      <CommonCardView
        title="Create New Thread"
        elementType="ChatThread"
        subtitle="Create a new thread in the current chat"
        listItems={[
          {
            icon: <PostAdd />,
            primary_text: 'Thread Name',
            secondary_text: (
              <Box sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder="Enter thread name (optional)"
                  value={threadName}
                  onChange={(e) => setThreadName(e.target.value)}
                  disabled={isSubmitting}
                />
              </Box>
            ),
          },
        ]}
      />
      <DialogActions>
        <Button 
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={isSubmitting}
        >
          Create Thread
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateThreadInChat;
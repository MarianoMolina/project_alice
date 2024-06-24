import React, { ChangeEvent, KeyboardEvent } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { MessageType } from '../utils/types';

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (message: string) => void;  // Update the type to accept a message
  lastMessage?: MessageType;
  chatSelected: boolean;  // Add this prop
}

const ChatInput: React.FC<ChatInputProps> = ({ newMessage, setNewMessage, handleSendMessage, lastMessage, chatSelected }) => {
  const handleAddFile = () => {
    alert('Add file button clicked');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && chatSelected) {
      handleSendMessage(newMessage);
      setNewMessage(''); // Clear the input box
    }
  };

  const handleClickSend = () => {
    handleSendMessage(newMessage);
    setNewMessage(''); // Clear the input box
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', mb: 1 }}>
        <TextField
          variant="outlined"
          fullWidth
          value={newMessage}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          disabled={!chatSelected}  // Disable input if no chat is selected
        />
        <Button variant="contained" sx={{ ml: 2 }} onClick={handleClickSend} disabled={!chatSelected}>
          Send
        </Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={handleAddFile} disabled={!chatSelected}>
          Add File
        </Button>
        {lastMessage && lastMessage.request_type === 'approval' && (
          <Box>
            <Button variant="contained" color="success" sx={{ mr: 2 }}>
              Approve
            </Button>
            <Button variant="contained" color="error">
              Reject
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatInput;

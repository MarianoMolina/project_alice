import React, { ChangeEvent, KeyboardEvent } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { MessageType } from '../../../types/ChatTypes';

interface ChatInputProps {
  handleSendMessage: (message: string) => void;
  lastMessage?: MessageType;
  chatSelected: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ handleSendMessage, lastMessage, chatSelected }) => {
  const [newMessage, setNewMessage] = React.useState('');
  const handleAddFile = () => {
    alert('Add file button clicked');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && chatSelected) {
      e.preventDefault();
      handleSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleClickSend = () => {
    handleSendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', mb: 1 }}>
        <TextField
          variant="outlined"
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          value={newMessage}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={!chatSelected}
          sx={{ flexGrow: 1 }}
        />
        <Button 
          variant="contained" 
          sx={{ ml: 2, alignSelf: 'flex-end' }} 
          onClick={handleClickSend} 
          disabled={!chatSelected || !newMessage.trim()}
        >
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
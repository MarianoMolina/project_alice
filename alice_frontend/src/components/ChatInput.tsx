import React, { ChangeEvent } from 'react';
import { Box, Button, TextField } from '@mui/material';

interface MessageType {
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_by: 'user' | 'llm';
  step?: string;
  assistant_name?: string;
  context?: Record<string, any>;
  type?: 'text' | 'image' | 'video' | 'audio' | 'file';
  request_type?: string;
}

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  lastMessage?: MessageType;
}

const ChatInput: React.FC<ChatInputProps> = ({ newMessage, setNewMessage, handleSendMessage, lastMessage }) => {
  const handleAddFile = () => {
    alert('Add file button clicked');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', mb: 1 }}>
        <TextField
          variant="outlined"
          fullWidth
          value={newMessage}
          onChange={handleChange}
        />
        <Button variant="contained" sx={{ ml: 2 }} onClick={handleSendMessage}>
          Send
        </Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={handleAddFile}>
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

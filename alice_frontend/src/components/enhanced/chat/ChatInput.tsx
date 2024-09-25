import React, { ChangeEvent, KeyboardEvent, useState, forwardRef, useImperativeHandle } from 'react';
import { Box, Button, TextField, Chip } from '@mui/material';
import { MessageType } from '../../../types/ChatTypes';
import { FileReference, FileType } from '../../../types/FileTypes';
import { selectFile } from '../../../utils/FileUtils';

interface ChatInputProps {
  sendMessage: (chatId: string, message: MessageType) => Promise<void>;
  currentChatId: string | null;
  lastMessage?: MessageType;
  chatSelected: boolean;
}

export interface ChatInputRef {
  addFileReference: (file: FileReference) => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({ 
  sendMessage, 
  currentChatId, 
  chatSelected, 
  lastMessage 
}, ref) => {
  const [newMessage, setNewMessage] = useState<MessageType>({
    role: 'user',
    content: '',
    generated_by: 'user',
    type: 'text',
    references: [],
  });

  useImperativeHandle(ref, () => ({
    addFileReference: (file: FileReference) => {
      setNewMessage(prev => ({
        ...prev,
        references: [...(prev.references || []), file],
      }));
    },
  }));

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewMessage(prev => ({ ...prev, content: e.target.value }));
  };

  const handleAddFile = async () => {
    const allowedTypes: FileType[] = [FileType.IMAGE, FileType.TEXT, FileType.AUDIO, FileType.VIDEO];
    const file = await selectFile(allowedTypes);
    if (!file) return;
    // Here you would typically upload the file and get a FileReference back
    // For now, we'll create a mock FileReference
    const mockFileReference: FileReference = {
      _id: Date.now().toString(),
      filename: file.name,
      type: file.type as FileType,
      file_size: file.size,
    };
    setNewMessage(prev => ({
      ...prev,
      references: [...(prev.references || []), mockFileReference],
    }));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && chatSelected) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (currentChatId && (newMessage.content.trim() || (newMessage.references && newMessage.references.length > 0))) {
      sendMessage(currentChatId, newMessage);
      setNewMessage({
        role: 'user',
        content: '',
        generated_by: 'user',
        type: 'text',
        references: [],
      });
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setNewMessage(prev => ({
      ...prev,
      references: prev.references?.filter(ref => ref._id !== fileId) || [],
    }));
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
          value={newMessage.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={!chatSelected}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="contained"
          sx={{ ml: 2, alignSelf: 'flex-end' }}
          onClick={handleSend}
          disabled={!chatSelected || (!newMessage.content.trim() && newMessage.references && newMessage.references.length === 0)}
        >
          Send
        </Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={handleAddFile} disabled={!chatSelected}>
          Add File
        </Button>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {newMessage.references?.map((file) => (
            <Chip
              key={file._id}
              label={file.filename}
              onDelete={() => handleRemoveFile(file._id)}
            />
          ))}
        </Box>
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
});

export default ChatInput;
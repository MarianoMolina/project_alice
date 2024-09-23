import React, { ChangeEvent, KeyboardEvent, useState } from 'react';
import { Box, Button, TextField, Chip } from '@mui/material';
import { MessageType } from '../../../types/ChatTypes';
import { useApi } from '../../../context/ApiContext';
import { FileReference, FileType } from '../../../types/FileTypes';
import { createFileContentReference, selectFile } from '../../../utils/FileUtils';

interface ChatInputProps {
  sendMessage: (chatId: string, message: MessageType) => Promise<void>;
  currentChatId: string | null;
  lastMessage?: MessageType;
  chatSelected: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ sendMessage, currentChatId, chatSelected, lastMessage }) => {
  const { uploadFileContentReference } = useApi();
  const [newMessage, setNewMessage] = useState<MessageType>({
    role: 'user',
    content: '',
    generated_by: 'user',
    type: 'text',
    references: [],
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewMessage(prev => ({ ...prev, content: e.target.value }));
  };

  const handleAddFile = async () => {
    const allowedTypes: FileType[] = [FileType.IMAGE, FileType.TEXT, FileType.AUDIO, FileType.VIDEO];
    const file = await selectFile(allowedTypes);
    if (!file) return;
    const fileContentReference = await createFileContentReference(file);
    const uploadedFile = await uploadFileContentReference(fileContentReference);

    if (uploadedFile) {
      console.log('File uploaded successfully:', uploadedFile);
      const fileReference: FileReference = {
        _id: uploadedFile._id,
        filename: uploadedFile.filename,
        type: uploadedFile.type,
        file_size: uploadedFile.file_size,
      };
      setNewMessage(prev => ({
        ...prev,
        references: [...(prev.references || []), fileReference],
      }));
    } else {
      console.log('File upload failed or was cancelled');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && chatSelected) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (currentChatId && newMessage.content.trim()) {
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
          disabled={!chatSelected || !newMessage.content.trim()}
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
};

export default ChatInput;
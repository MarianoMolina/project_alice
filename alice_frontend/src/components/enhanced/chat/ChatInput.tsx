import { ChangeEvent, KeyboardEvent, useState, forwardRef, useImperativeHandle } from 'react';
import { Box, Button, TextField, Chip } from '@mui/material';
import { MessageType } from '../../../types/ChatTypes';
import { FileReference, FileType } from '../../../types/FileTypes';
import { createFileContentReference, selectFile } from '../../../utils/FileUtils';
import { useApi } from '../../../context/ApiContext';
import { useNotification } from '../../../context/NotificationContext';
import { TaskResponse } from '../../../types/TaskResponseTypes';

interface ChatInputProps {
  sendMessage: (chatId: string, message: MessageType) => Promise<void>;
  currentChatId: string | null;
  lastMessage?: MessageType;
  chatSelected: boolean;
}

export interface ChatInputRef {
  addFileReference: (file: FileReference) => void;
  addTaskResponse: (taskResponse: TaskResponse) => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({ 
  sendMessage, 
  currentChatId, 
  chatSelected, 
  lastMessage 
}, ref) => {
  const { addNotification } = useNotification();
  const { uploadFileContentReference } = useApi();
  const [newMessage, setNewMessage] = useState<MessageType>({
    role: 'user',
    content: '',
    generated_by: 'user',
    type: 'text',
    references: [],
    task_responses: [],
  });

  useImperativeHandle(ref, () => ({
    addFileReference: (file: FileReference) => {
      setNewMessage(prev => ({
        ...prev,
        references: [...(prev.references || []), file],
      }));
    },
    addTaskResponse: (taskResponse: TaskResponse) => {
      setNewMessage(prev => ({
        ...prev,
        task_responses: [...(prev.task_responses || []), taskResponse],
      }));
    },
  }));

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewMessage(prev => ({ ...prev, content: e.target.value }));
  };

  const handleAddFile = async () => {
    const allowedTypes: FileType[] = [FileType.IMAGE, FileType.TEXT, FileType.AUDIO, FileType.VIDEO];
    const selectedFile = await selectFile(allowedTypes);
    if (!selectedFile) return;
    
    const fileContentReference = await createFileContentReference(selectedFile);
    const file = await uploadFileContentReference(fileContentReference);
    if (!file) {
        addNotification('File upload failed or was cancelled', 'error');
        console.log('File upload failed or was cancelled');
        return;
    }
    setNewMessage(prev => ({
      ...prev,
      references: [...(prev.references || []), file],
    }));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && chatSelected) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (currentChatId && (newMessage.content.trim() || (newMessage.references && newMessage.references.length > 0) || (newMessage.task_responses && newMessage.task_responses.length > 0))) {
      sendMessage(currentChatId, newMessage);
      setNewMessage({
        role: 'user',
        content: '',
        generated_by: 'user',
        type: 'text',
        references: [],
        task_responses: [],
      });
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setNewMessage(prev => ({
      ...prev,
      references: prev.references?.filter(ref => ref._id !== fileId) || [],
    }));
  };

  const handleRemoveTaskResponse = (taskResponseId: string) => {
    setNewMessage(prev => ({
      ...prev,
      task_responses: prev.task_responses?.filter(response => response._id !== taskResponseId) || [],
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
          disabled={!chatSelected || (!newMessage.content.trim() && newMessage.references?.length === 0 && newMessage.task_responses?.length === 0)}
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
          {newMessage.task_responses?.map((taskResponse) => (
            <Chip
              key={taskResponse._id}
              label={`Task: ${taskResponse.task_name}`}
              onDelete={() => taskResponse._id ? handleRemoveTaskResponse(taskResponse._id) : undefined}
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
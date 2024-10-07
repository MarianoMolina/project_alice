import { ChangeEvent, KeyboardEvent, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Box, Button, TextField, Chip, Tooltip } from '@mui/material';
import { ContentType, getDefaultMessageForm, MessageType } from '../../../../types/MessageTypes';
import { FileReference, FileType } from '../../../../types/FileTypes';
import { createFileContentReference, selectFile } from '../../../../utils/FileUtils';
import { useApi } from '../../../../contexts/ApiContext';
import { useNotification } from '../../../../contexts/NotificationContext';
import { TaskResponse } from '../../../../types/TaskResponseTypes';
import { URLReference } from '../../../../types/URLReferenceTypes';
import { References } from '../../../../types/ReferenceTypes';
import { AttachFile } from '@mui/icons-material';

interface ChatInputProps {
  sendMessage: (chatId: string, message: MessageType) => Promise<void>;
  currentChatId: string | null;
  chatSelected: boolean;
}

export interface ChatInputRef {
  addFileReference: (file: FileReference) => void;
  addTaskResponse: (taskResponse: TaskResponse) => void;
  addURLReference: (urlReference: URLReference) => void;
  addMessageReference: (message: MessageType) => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({
  sendMessage,
  currentChatId,
  chatSelected,
}, ref) => {
  const { addNotification } = useNotification();
  const { uploadFileContentReference } = useApi();
  const [newMessage, setNewMessage] = useState<MessageType>(getDefaultMessageForm());

  const updateMessageType = useCallback((references: References): ContentType => {
    const types = new Set<ContentType>();
    if (references.files?.length) {
      references.files.forEach(file => types.add(file.type as unknown as ContentType));
    }
    if (references.task_responses?.length) types.add(ContentType.TASK_RESULT);
    if (references.search_results?.length) types.add(ContentType.URL_REFERENCE);
    if (references.messages?.length) types.add(ContentType.TEXT);
    if (references.string_outputs?.length) types.add(ContentType.TEXT);

    return types.size > 1 ? ContentType.MULTIPLE : types.values().next().value || ContentType.TEXT;
  }, []);

  const addReference = useCallback((type: keyof References, item: any) => {
    setNewMessage(prev => {
      const updatedReferences = { ...prev.references };
      if (!updatedReferences[type]) {
        updatedReferences[type] = [];
      }
      if (!updatedReferences[type]!.some((ref: any) => ref._id === item._id)) {
        updatedReferences[type] = [...updatedReferences[type]!, item];
      }
      const updatedType = updateMessageType(updatedReferences);
      return { ...prev, references: updatedReferences, type: updatedType };
    });
  }, [updateMessageType]);

  const removeReference = useCallback((type: keyof References, id: string) => {
    setNewMessage(prev => {
      const updatedReferences = { ...prev.references };
      if (updatedReferences[type]) {
        updatedReferences[type] = (updatedReferences[type] as any[]).filter((ref: any) => ref._id !== id);
      }
      const updatedType = updateMessageType(updatedReferences);
      return { ...prev, references: updatedReferences, type: updatedType };
    });
  }, [updateMessageType]);

  useImperativeHandle(ref, () => ({
    addFileReference: (file: FileReference) => addReference('files', file),
    addTaskResponse: (taskResponse: TaskResponse) => addReference('task_responses', taskResponse),
    addURLReference: (urlReference: URLReference) => addReference('search_results', urlReference),
    addMessageReference: (message: MessageType) => addReference('messages', message),
  }));

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewMessage(prev => ({ ...prev, content: e.target.value }));
  };

  const handleAddFile = async () => {
    const allowedTypes: FileType[] = [FileType.IMAGE, FileType.AUDIO, FileType.VIDEO];
    const selectedFile = await selectFile(allowedTypes);
    if (!selectedFile) return;

    const fileContentReference = await createFileContentReference(selectedFile);
    const file = await uploadFileContentReference(fileContentReference);
    if (!file) {
      addNotification('File upload failed or was cancelled', 'error');
      return;
    }
    addReference('files', file);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && chatSelected) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (currentChatId && (newMessage.content.trim() || hasReferences(newMessage.references))) {
      console.log('Sending message content:', newMessage.content);
      sendMessage(currentChatId, newMessage);
      setNewMessage(getDefaultMessageForm());
    }
  };

  const hasReferences = (references: References | undefined): boolean => {
    return Object.values(references || {}).some(arr => arr && arr.length > 0);
  };

  const renderReferenceChips = () => {
    const chips: JSX.Element[] = [];

    Object.entries(newMessage.references || {}).forEach(([type, refs]) => {
      (refs as any[])?.forEach((ref: any) => {
        let label = '';
        switch (type as keyof References) {
          case 'files':
            label = (ref as FileReference).filename;
            break;
          case 'task_responses':
            label = `Task: ${(ref as TaskResponse).task_name}`;
            break;
          case 'search_results':
            label = `Search: ${(ref as URLReference).title}`;
            break;
          case 'messages':
            label = `Message: ${(ref as MessageType).content.substring(0, 20)}...`;
            break;
          case 'string_outputs':
            label = `Output: ${ref.substring(0, 20)}...`;
            break;
        }
        chips.push(
          <Chip
            key={ref._id || ref}
            label={label}
            onDelete={() => removeReference(type as keyof References, ref._id || ref)}
          />
        );
      });
    });

    return chips;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex' }}>
        <Tooltip title="Upload an image, video, sound or text file to give your assistant access to it">
          <span style={{ paddingRight: '5px' }}>
            <Button variant="outlined" onClick={handleAddFile} disabled={!chatSelected} sx={{width: '100%', height: '100%'}}>
              <AttachFile />
            </Button>
          </span>
        </Tooltip>
        <TextField
          variant="outlined"
          fullWidth
          multiline
          minRows={1}
          maxRows={8}
          value={newMessage.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={!chatSelected}
          sx={{
            flexGrow: 1,
            '& .MuiInputBase-root': {
              maxHeight: '200px',
              overflowY: 'auto',
            },
          }}
          InputProps={{
            style: { whiteSpace: 'pre-wrap' },
          }}
        />
        <Button
          variant="contained"
          sx={{ ml: 1, mt: 'auto', mb: 'auto', alignSelf: 'flex-end' }}
          onClick={handleSend}
          disabled={!chatSelected || (!newMessage.content.trim() && !hasReferences(newMessage.references))}
        >
          Send
        </Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {renderReferenceChips()}
        </Box>
      </Box>
    </Box>
  );
});

export default ChatInput;
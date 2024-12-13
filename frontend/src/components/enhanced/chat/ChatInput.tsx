import { ChangeEvent, KeyboardEvent, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Box, Button, TextField, Chip, Tooltip, Typography } from '@mui/material';
import { ContentType, getDefaultMessageForm, MessageType, PopulatedMessage } from '../../../types/MessageTypes';
import { FileReference, FileType, PopulatedFileReference } from '../../../types/FileTypes';
import { createFileContentReference, selectFile } from '../../../utils/FileUtils';
import { useApi } from '../../../contexts/ApiContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { PopulatedTaskResponse, TaskResponse } from '../../../types/TaskResponseTypes';
import { PopulatedReferences, References } from '../../../types/ReferenceTypes';
import { AttachFile } from '@mui/icons-material';
import Logger from '../../../utils/Logger';
import { EntityReference, PopulatedEntityReference } from '../../../types/EntityReferenceTypes';

interface ChatInputProps {
  sendMessage: (chatId: string, message: PopulatedMessage) => Promise<void>;
  currentChatId: string | null;
  chatSelected: boolean;
  chatContextCharacterCount: number;
  maxContext: number;
}

export interface ChatInputRef {
  addFileReference: (file: PopulatedFileReference | FileReference) => void;
  addTaskResponse: (taskResponse: PopulatedTaskResponse | TaskResponse) => void;
  addEntityReference: (entityReference: PopulatedEntityReference | EntityReference) => void;
  addMessageReference: (message: PopulatedMessage | MessageType) => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({
  sendMessage,
  currentChatId,
  chatSelected,
  chatContextCharacterCount,
  maxContext
}, ref) => {
  const { addNotification } = useNotification();
  const { uploadFileContentReference } = useApi();
  const [newMessage, setNewMessage] = useState<PopulatedMessage>(getDefaultMessageForm());

  const tokenEst = Math.floor(chatContextCharacterCount / 3)
  const tokenRatio = tokenEst / maxContext
  const percentageToken = (Math.floor(tokenRatio * 10000) / 100).toString() + '%'
  const contextWarning = tokenRatio > 0.8 ? true : false

  const updateMessageType = useCallback((references: PopulatedReferences): ContentType => {
    const types = new Set<ContentType>();
    if (references.files?.length) {
      references.files.forEach(file => types.add(file.type as unknown as ContentType));
    }
    if (references.task_responses?.length) types.add(ContentType.TASK_RESULT);
    if (references.entity_references?.length) types.add(ContentType.MULTIPLE);
    if (references.messages?.length) types.add(ContentType.TEXT);
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
        addNotification('Reference added', 'success');
      } else {
        addNotification('Reference already added', 'info');
      }
      const updatedType = updateMessageType(updatedReferences);
      return { ...prev, references: updatedReferences, type: updatedType };
    });
  }, [updateMessageType, addNotification]);

  const removeReference = useCallback((type: keyof References, id: string) => {
    setNewMessage(prev => {
      const updatedReferences = { ...prev.references };
      if (updatedReferences[type]) {
        updatedReferences[type] = (updatedReferences[type] as any[]).filter((ref: any) => ref._id !== id);
        addNotification('Reference removed', 'info');
      }
      const updatedType = updateMessageType(updatedReferences);
      return { ...prev, references: updatedReferences, type: updatedType };
    });
  }, [updateMessageType, addNotification]);

  useImperativeHandle(ref, () => ({
    addFileReference: (file: PopulatedFileReference | FileReference) => addReference('files', file),
    addTaskResponse: (taskResponse: PopulatedTaskResponse | TaskResponse) => addReference('task_responses', taskResponse),
    addEntityReference: (entityReference: PopulatedEntityReference | EntityReference) => addReference('entity_references', entityReference),
    addMessageReference: (message: PopulatedMessage | MessageType) => addReference('messages', message),
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
    if (currentChatId && (newMessage.content.trim() || hasReferences(newMessage.references as References))) {
      Logger.debug('Sending message content:', newMessage.content);
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
            label = (ref as PopulatedFileReference).filename;
            break;
          case 'task_responses':
            label = `Task: ${(ref as PopulatedTaskResponse).task_name}`;
            break;
          case 'entity_references':
            label = `Search: ${(ref as PopulatedEntityReference).name}`;
            break;
          case 'messages':
            label = `Message: ${(ref as PopulatedMessage).content.substring(0, 20)}...`;
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
            <Button variant="outlined" onClick={handleAddFile} disabled={!chatSelected} sx={{ width: '100%', height: '100%' }}>
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
        <Box className="flex items-center gap-2" sx={{ alignSelf: 'flex-end', ml: 1, mt: 'auto', mb: 'auto' }}>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!chatSelected || (!newMessage.content.trim() && !hasReferences(newMessage.references as References))}
          >
            Send
          </Button>

          <Tooltip title={`Est. context used: ${tokenEst} / ${maxContext}`}>
            <Typography
              variant="caption"
              color={contextWarning ? "error" : "textSecondary"}
            >
              {percentageToken}
            </Typography>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1 }}>
          {renderReferenceChips()}
        </Box>
      </Box>
    </Box >
  );
});

export default ChatInput;
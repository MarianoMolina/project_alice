import { ChangeEvent, KeyboardEvent, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Box, IconButton, Paper, TextField, Tooltip, Typography } from '@mui/material';
import { ContentType, getDefaultMessageForm, MessageType, PopulatedMessage, RoleType } from '../../../types/MessageTypes';
import { FileReference, FileType, PopulatedFileReference } from '../../../types/FileTypes';
import { createFileContentReference, selectFile } from '../../../utils/FileUtils';
import { useApi } from '../../../contexts/ApiContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { PopulatedTaskResponse, TaskResponse } from '../../../types/TaskResponseTypes';
import { PopulatedReferences, References } from '../../../types/ReferenceTypes';
import { AttachFile, Send } from '@mui/icons-material';
import Logger from '../../../utils/Logger';
import { EntityReference, PopulatedEntityReference } from '../../../types/EntityReferenceTypes';
import ReferenceChip from '../../enhanced/data_cluster/ReferenceChip';
import { PopulatedToolCall, ToolCall } from '../../../types/ToolCallTypes';
import { CodeExecution, PopulatedCodeExecution } from '../../../types/CodeExecutionTypes';
import { EmbeddingChunk } from '../../../types/EmbeddingChunkTypes';
import { PopulatedUserInteraction, UserInteraction } from '../../../types/UserInteractionTypes';
import { useChat } from '../../../contexts/ChatContext';
import ActionButton from './ChatActionButton';

interface ChatInputProps {
}

export interface ChatInputRef {
  addFileReference: (file: PopulatedFileReference | FileReference) => void;
  addTaskResponse: (taskResponse: PopulatedTaskResponse | TaskResponse) => void;
  addEntityReference: (entityReference: PopulatedEntityReference | EntityReference) => void;
  addMessageReference: (message: PopulatedMessage | MessageType) => void;
  addToolCallReference: (toolCall: PopulatedToolCall | ToolCall) => void;
  addCodeExecutionReference: (codeExecution: PopulatedCodeExecution | CodeExecution) => void;
  addEmbeddingChunkReference: (embeddingChunk: EmbeddingChunk) => void;
  addUserInteractionReference: (userInteraction: PopulatedUserInteraction | UserInteraction) => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({ }, ref) => {
  const { addNotification } = useNotification();
  const { uploadFileContentReference } = useApi();
  const {
    handleSendMessage, currentChatId, chatContextCharacterCount, 
    maxContext, isGenerating, generateResponse, error,
    handleRegenerateResponse, lastMessageRole, currentThread
  } = useChat();
  const [newMessage, setNewMessage] = useState<PopulatedMessage>(getDefaultMessageForm());

  const tokenEst = Math.floor(chatContextCharacterCount / 3)
  const tokenRatio = tokenEst / maxContext
  const percentageToken = (Math.floor(tokenRatio * 10000) / 100).toString() + '%'
  const contextWarning = tokenRatio > 0.8

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
    addToolCallReference: (toolCall: PopulatedToolCall | ToolCall) => addReference('tool_calls', toolCall),
    addCodeExecutionReference: (codeExecution: PopulatedCodeExecution | CodeExecution) => addReference('code_executions', codeExecution),
    addEmbeddingChunkReference: (embeddingChunk: EmbeddingChunk) => addReference('embeddings', embeddingChunk),
    addUserInteractionReference: (userInteraction: PopulatedUserInteraction | UserInteraction) => addReference('user_interactions', userInteraction),
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
    if (e.key === 'Enter' && !e.shiftKey && currentChatId) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasReferences = (references: References | undefined): boolean => {
    return Object.values(references || {}).some(arr => arr && arr.length > 0);
  };

  const hasReferencesToShow = hasReferences(newMessage.references as References);
  const showSendButton = currentChatId && (newMessage.content.trim() || hasReferencesToShow) && currentThread && !isGenerating

  const handleSend = () => {
    if (showSendButton) {
      Logger.debug('Sending message content:', newMessage.content);
      handleSendMessage(currentChatId, currentThread?._id!, newMessage);
      setNewMessage(getDefaultMessageForm());
    }
  };

  const renderReferenceChips = () => {
    const chips: JSX.Element[] = [];

    Object.entries(newMessage.references || {}).forEach(([type, refs]) => {
      const collectionType = type === 'files' ? 'File' :
        type === 'task_responses' ? 'TaskResponse' :
          type === 'entity_references' ? 'EntityReference' :
            type === 'messages' ? 'Message' : null;

      if (collectionType && refs) {
        (refs as any[]).forEach((ref: any) => {
          chips.push(
            <ReferenceChip
              key={ref._id}
              reference={ref}
              type={collectionType}
              delete={true}
              onDelete={() => removeReference(type as keyof References, ref._id)}
              view={true}
            />
          );
        });
      }
    });

    return chips;
  };


  return (
    <Paper
      elevation={1}
      sx={{
        p: 1,
        backgroundColor: 'background.paper',
        borderRadius: '8px',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Text Input Area */}
        <TextField
          variant="standard"
          fullWidth
          multiline
          minRows={1}
          maxRows={8}
          value={newMessage.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={!currentChatId}
          placeholder="Type your message..."
          sx={{
            width: '100%',
            '& .MuiInputBase-root': {
              maxHeight: '200px',
              overflowY: 'auto',
              paddingY: 1,
            },
            '& .MuiInput-root:before': {
              borderBottom: 'none'
            },
            '& .MuiInput-root:hover:not(.Mui-disabled):before': {
              borderBottom: 'none'
            },
            '& .MuiInput-root:after': {
              borderBottom: 'none'
            }
          }}
        />

        {/* Bottom Area */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          minHeight: '40px'
        }}>
          {/* Reference Chips Area */}
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            flex: 1,
            marginRight: 2
          }}>
            {renderReferenceChips()}
          </Box>

          {/* Actions Area */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0
          }}>
            {error && (
              <Tooltip title={error.message}>
                <Typography variant="caption" color="error">
                  Error: {error.name}{error.cause ? ` - Cause: ${error.cause}` : ''}
                </Typography>
              </Tooltip>
            )}
            <ActionButton
              isGenerating={isGenerating}
              role={lastMessageRole ? lastMessageRole as RoleType : undefined}
              generateResponse={generateResponse}
              handleRegenerateResponse={handleRegenerateResponse}
            />

            {/* Action Buttons */}
            <Tooltip title="Upload an image, video, sound or text file">
              <span>
                <IconButton
                  onClick={handleAddFile}
                  disabled={!currentChatId}
                  size="medium"
                  sx={{
                    width: '40px',
                    height: '40px',
                  }}
                >
                  <AttachFile />
                </IconButton>
              </span>
            </Tooltip>

            {/* Context Percentage */}
            <Tooltip title={`Est. context used: ${tokenEst} / ${maxContext}`}>
              <Typography
                variant="caption"
                color={contextWarning ? "error" : "textSecondary"}
              >
                {percentageToken}
              </Typography>
            </Tooltip>

            <Tooltip title="Send message">
              <span>
                <IconButton
                  onClick={handleSend}
                  disabled={!showSendButton}
                  size="medium"
                  color="primary"
                  sx={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: showSendButton ? 'primary.main' : 'transparent',
                    color: showSendButton ? 'white' : 'inherit',
                    '&:hover': {
                      backgroundColor: showSendButton ? 'primary.dark' : 'transparent',
                    },
                  }}
                >
                  <Send />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
});

export default ChatInput;
import React, { useState } from 'react';
import { Box, Typography, Tooltip, IconButton, Dialog, DialogContent, Chip } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import EditIcon from '@mui/icons-material/Edit';
import useStyles from './MessageStyles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Visibility } from '@mui/icons-material';
import { MessageType } from '../../../../types/MessageTypes';
import { WorkflowOutput } from '../../task_response/WorkflowOutput';
import { CommandLineLog } from '../../task_response/CommandLog';
import { BackgroundBeams } from '../../../ui/aceternity/BackgroundBeams';
import { FileReference } from '../../../../types/FileTypes';
import MessageDetail from './MessageDetail';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import { TaskResponse } from '../../../../types/TaskResponseTypes';

interface MessageProps {
  message: MessageType;
  chatId?: string;
}

const Message: React.FC<MessageProps> = ({ message, chatId }) => {
  const classes = useStyles();
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailMode, setDetailMode] = useState<'view' | 'edit'>('view');
  const { selectItem } = useCardDialog();

  const getCreatorName = (message: MessageType) => {
    const createdBy = message.created_by;
    const assistantName = message.assistant_name;
    const role = message.role;
    const typeMsg = message.type;

    if (typeMsg === 'task_result') return 'Task Response';
    if (role === 'assistant') {
      if (assistantName) return assistantName;
      return "Assistant"
    }
    if (role === 'user') {
      if (createdBy) {
        if (typeof createdBy === 'string') return "User";
        if (createdBy && typeof createdBy === 'object' && 'name' in createdBy) return createdBy.name;
      }
      return "User"
    }
  };

  const getMessageClass = () => {
    if (message.generated_by === 'tool') return classes.toolMessage;
    switch (message.role) {
      case 'user':
        return classes.userMessage;
      case 'assistant':
      default:
        return classes.assistantMessage;
    }
  };

  const renderMessageContent = () => {
    if (message.type === 'task_result' && message.task_responses) {
      return <WorkflowOutput content={message.task_responses} />;
    } else if (message.generated_by === 'tool') {
      return <CommandLineLog content={message.content} />;
    } else {
      return <ReactMarkdown className={classes.markdownText}>{message.content}</ReactMarkdown>;
    }
  };

  const hasNonEmptyContext = message.context && Object.keys(message.context).length > 0;

  const renderFileReferences = () => {
    console.log('Message references:', message.references);
    if (!message.references || message.references.length === 0) return null;

    return (
      <Box className={classes.fileReferencesContainer}>
        <Typography variant="subtitle2">Referenced Files:</Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {message.references.map((reference, index) => (
            <Chip
              key={index}
              label={reference.filename}
              onDelete={() => handleViewFile(reference)}
              deleteIcon={<Visibility />}
              variant="outlined"
            />
          ))}
        </Box>
      </Box>
    );
  };

  const renderTaskResponses = () => {
    if (!message.task_responses || message.task_responses.length === 0) return null;

    return (
      <Box className={classes.taskResponsesContainer}>
        <Typography variant="subtitle2">Task Responses:</Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {message.task_responses.map((taskResponse, index) => (
            <Chip
              key={index}
              label={`Task: ${taskResponse.task_name}`}
              onDelete={() => handleViewTaskResponse(taskResponse)}
              deleteIcon={<Visibility />}
              variant="outlined"
            />
          ))}
        </Box>
      </Box>
    );
  };

  const handleViewFile = (reference: FileReference) => {
    selectItem('File', reference._id ?? null, reference);
  };

  const handleViewTaskResponse = (taskResponse: TaskResponse) => {
    selectItem('TaskResponse', taskResponse._id ?? '', taskResponse);
  };

  const handleViewDetails = () => {
    setDetailMode('view');
    setIsDetailDialogOpen(true);
  };

  const handleEditDetails = () => {
    setDetailMode('edit');
    setIsDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
  };

  const handleMessageUpdate = (updatedMessage: MessageType) => {
    // Handle the updated message (e.g., update the state in the parent component)
    console.log('Message updated:', updatedMessage);
  };


  return (
    <Box className={`${classes.message} ${getMessageClass()}`}>
      <BackgroundBeams className="absolute inset-0 w-full h-full" />
      <Box className="relative">
        <Box className={classes.messageHeader}>
          <Tooltip title="The creator of this message" arrow>
            <Typography variant="caption" className={classes.assistantName}>
              {message.assistant_name || getCreatorName(message)}
            </Typography>
          </Tooltip>
          <Box>
            <IconButton
              size="small"
              onClick={handleViewDetails}
              className={classes.viewButton}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            {chatId && (
              <IconButton
                size="small"
                onClick={handleEditDetails}
                className={classes.editButton}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
        {renderMessageContent()}
        {renderFileReferences()}
        {renderTaskResponses()}
        <Box className={classes.metadataContainer}>
          {message.step && (
            <Tooltip title="Task or source that produced this message" arrow>
              <Typography variant="caption" className={classes.metadata}>
                Step: {message.step}
              </Typography>
            </Tooltip>
          )}
          {hasNonEmptyContext && (
            <Tooltip title="Context relevant to the creation of this message" arrow>
              <Typography variant="caption" className={classes.metadata}>
                Context: {JSON.stringify(message.context)}
              </Typography>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Dialog open={isDetailDialogOpen} onClose={handleCloseDetailDialog} maxWidth="md" fullWidth>
        <DialogContent>
          <MessageDetail
            message={message}
            chatId={chatId}
            mode={detailMode}
            onUpdate={handleMessageUpdate}
            onClose={handleCloseDetailDialog}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Message;
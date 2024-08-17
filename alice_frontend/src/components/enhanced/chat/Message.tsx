import React, { useState } from 'react';
import { Box, Typography, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import EditIcon from '@mui/icons-material/Edit';
import useStyles from './MessageStyles';
import { MessageType, MessageProps } from '../../../types/ChatTypes';
import { WorkflowOutput } from '../task_response/WorkflowOutput';
import { CommandLineLog } from '../task_response/CommandLog';
import { BackgroundBeams } from '../../ui/aceternity/BackgroundBeams';

const Message: React.FC<MessageProps> = ({ message }) => {
  const classes = useStyles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const handleEditClick = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
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
          <IconButton 
            size="small" 
            onClick={handleEditClick}
            className={classes.editButton}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
        {renderMessageContent()}
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

      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Edit Message</DialogTitle>
        <DialogContent>
          <Typography>Placeholder for message editing functionality</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Message;
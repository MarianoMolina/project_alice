import React, { useState } from 'react';
import { Typography, List, ListItemButton, ListItemText, ListItemIcon, Dialog } from '@mui/material';
import { SupportAgent, Terminal, Functions, Summarize } from '@mui/icons-material';
import { AliceChat, AliceAgent, TaskResponse, AliceTask } from '../../utils/types';
import NewTask from '../db_elements/NewTask';
import TaskResult from '../db_elements/TaskResult';
import useStyles from '../../styles/ChatDetailsStyles';

interface ChatDetailsProps {
  currentChat: AliceChat | null;
  agents: AliceAgent[];
  tasks: AliceTask[];
  taskResults: TaskResponse[];
  onAddTasksToChat: (taskIds: string[]) => Promise<void>;
  onAddTaskResultsToChat: (taskResultIds: string[]) => Promise<void>;
  isTaskInChat: (taskId: string) => boolean;
  isTaskResultInChat: (taskResultId: string) => boolean;
}

const ChatDetails: React.FC<ChatDetailsProps> = ({
  currentChat,
}) => {
  const classes = useStyles();
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openTaskResultDialog, setOpenTaskResultDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [selectedTaskResultId, setSelectedTaskResultId] = useState<string | undefined>(undefined);

  if (!currentChat) {
    return <Typography>No chat selected</Typography>;
  }

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setOpenTaskDialog(true);
  };

  const handleTaskResultClick = (taskResultId: string) => {
    setSelectedTaskResultId(taskResultId);
    setOpenTaskResultDialog(true);
  };

  return (
    <div className={classes.chatDetails}>
      <Typography variant="h6">Agents</Typography>
      <List>
        <ListItemButton>
          <ListItemIcon><SupportAgent /></ListItemIcon>
          <ListItemText primary="Alice Agent" secondary={currentChat.alice_agent?.name || 'N/A'} />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon><Terminal /></ListItemIcon>
          <ListItemText primary="Execution Agent" secondary={currentChat.executor?.name || 'N/A'} />
        </ListItemButton>
      </List>
      <Typography variant="h6">Available Functions</Typography>
      <List>
        {currentChat.functions && currentChat.functions.length > 0 ? (
          currentChat.functions.map((func, index) => (
            <ListItemButton key={index} onClick={() => func._id && handleTaskClick(func._id)}>
              <ListItemIcon><Functions /></ListItemIcon>
              <ListItemText primary={func.task_name} />
            </ListItemButton>
          ))
        ) : (
          <Typography variant="body2">No functions available</Typography>
        )}
      </List>
      <Typography variant="h6">Task Results</Typography>
      <List>
        {currentChat.task_responses && currentChat.task_responses.length > 0 ? (
          currentChat.task_responses.map((result, index) => (
            <ListItemButton key={index} onClick={() => result._id && handleTaskResultClick(result._id)}>
              <ListItemIcon><Summarize /></ListItemIcon>
              <ListItemText
                primary={result.task_name}
                secondary={`Status: ${result.status}, Code: ${result.result_code}`}
              />
            </ListItemButton>
          ))
        ) : (
          <Typography variant="body2">No task responses yet</Typography>
        )}
      </List>

      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)}>
        {selectedTaskId && (
          <NewTask taskId={selectedTaskId} onTaskCreated={() => setOpenTaskDialog(false)} viewOnly={true} />
        )}
      </Dialog>

      <Dialog open={openTaskResultDialog} onClose={() => setOpenTaskResultDialog(false)}>
        {selectedTaskResultId && (
          <TaskResult 
            taskResponse={currentChat.task_responses?.find(r => r._id === selectedTaskResultId)!} 
          />
        )}
      </Dialog>
    </div>
  );
};

export default ChatDetails;
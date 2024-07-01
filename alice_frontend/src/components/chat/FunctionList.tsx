import React, { useState } from 'react';
import { List, ListItem, ListItemText, IconButton, Dialog, Tooltip } from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import { AliceTask } from '../../utils/types';
import Task from '../db_elements/Task';

interface FunctionListProps {
  tasks: AliceTask[];
  onAddTask: (taskId: string) => Promise<void>;
  isTaskInChat: (taskId: string) => boolean;
}

const FunctionList: React.FC<FunctionListProps> = ({ tasks, onAddTask, isTaskInChat }) => {
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setOpenTaskDialog(true);
  };

  const handleAddTask = async (taskId: string) => {
    await onAddTask(taskId);
  };
 
  return (
    <List>
      {tasks.map((task) => (
        <ListItem key={task._id} dense>
          <ListItemText
            primary={task.task_name}
            secondary={task.task_description}
          />
          <Tooltip title="View Task">
            <IconButton edge="end" onClick={() => task._id && handleTaskClick(task._id)}>
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title={isTaskInChat(task._id || '') ? "Already in chat" : "Add to chat"}>
            <span>
              <IconButton
                edge="end"
                onClick={() => task._id && handleAddTask(task._id)}
                disabled={isTaskInChat(task._id || '')}
              >
                <Add />
              </IconButton>
            </span>
          </Tooltip>
        </ListItem>
      ))}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)}>
        {selectedTaskId && (
          <Task taskId={selectedTaskId} onClose={() => setOpenTaskDialog(false)} viewOnly={true} />
        )}
      </Dialog>
    </List>
  );
};

export default FunctionList;
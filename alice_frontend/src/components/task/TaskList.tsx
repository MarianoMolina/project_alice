import React, { useState } from 'react';
import { List, ListItem, ListItemText, IconButton, Dialog, Tooltip } from '@mui/material';
import { ChevronRight, Visibility } from '@mui/icons-material';
import { AliceTask } from '../../utils/types';
import useStyles from '../../styles/TaskListStyles';
import NewTask from '../db_elements/NewTask';

interface TaskListProps {
  tasks: AliceTask[];
  onSelectTask: (task: AliceTask) => void;
}
const TaskList: React.FC<TaskListProps> = ({ tasks, onSelectTask }) => {
  const classes = useStyles();
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setOpenTaskDialog(true);
  };

  const handleAddTask = async (task: AliceTask) => {
    await onSelectTask(task);
  };
 
  return (
    <List className={classes.taskList}>
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
          <Tooltip title={"Choose task to execute"}>
            <span>
              <IconButton
                edge="end"
                onClick={() => task._id && handleAddTask(task)}
              >
                <ChevronRight />
              </IconButton>
            </span>
          </Tooltip>
        </ListItem>
      ))}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)}>
        {selectedTaskId && (
          <NewTask taskId={selectedTaskId} onTaskCreated={() => setOpenTaskDialog(false)} viewOnly={true} />
        )}
      </Dialog>
    </List>
  );

};

export default TaskList;
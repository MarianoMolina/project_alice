import React from 'react';
import { Typography, List, ListItemButton, ListItemText, ListItemIcon, Box } from '@mui/material';
import { Category, LibraryBooks, AddCircleOutline } from '@mui/icons-material';
import { AliceTask } from '../../utils/types';
import useStyles from '../../styles/TaskDetailStyles';

interface TaskDetailProps {
  task: AliceTask;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task }) => {
  const classes = useStyles();

  return (
    <Box className={classes.taskDetail}>
      <Typography variant="h6" className={classes.title}>Active Task</Typography>
      <Typography variant="subtitle1">{task.task_name}</Typography>
      <Typography variant="body2">{task.task_description}</Typography>
      <Typography variant="caption" className={classes.taskId}>
        Task ID: {task._id}
      </Typography>

      <List>
        <ListItemButton>
          <ListItemIcon><Category /></ListItemIcon>
          <ListItemText primary="Task Type" secondary={task.task_type} />
        </ListItemButton>

        <ListItemButton>
          <ListItemIcon><LibraryBooks /></ListItemIcon>
          <ListItemText
            primary="Templates"
            secondary={`${Object.keys(task.templates || {}).length} template(s)`}
          />
        </ListItemButton>

        <ListItemButton>
          <ListItemIcon><AddCircleOutline /></ListItemIcon>
          <ListItemText
            primary="Prompts to Add"
            secondary={`${Object.keys(task.prompts_to_add || {}).length} prompt(s)`}
          />
        </ListItemButton>
      </List>
    </Box>
  );
};

export default TaskDetail;
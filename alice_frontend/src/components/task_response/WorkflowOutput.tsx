import React from 'react';
import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { TaskResponse } from '../../utils/TaskResponseTypes';


interface WorkflowOutputProps {
  content: TaskResponse[];
}

export const WorkflowOutput: React.FC<WorkflowOutputProps> = ({ content }) => {
  return (
    <List>
      {content.map((task, index) => (
        <ListItem key={index}>
          <ListItemText
            primary={<Typography variant="subtitle1">{task.task_name}</Typography>}
            secondary={
              <>
                <Typography component="span" variant="body2" color="textSecondary">
                  {task.task_description}
                </Typography>
                <Typography component="span" variant="body2" display="block">
                  Task Output: {task.task_outputs}
                </Typography>
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};
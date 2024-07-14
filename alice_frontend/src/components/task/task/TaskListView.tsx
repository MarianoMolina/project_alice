import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    IconButton,
    Tooltip
} from '@mui/material';
import { Visibility, PlayArrow } from '@mui/icons-material';
import { AliceTask, TaskComponentProps } from '../../../utils/TaskTypes';

const TaskListView: React.FC<TaskComponentProps> = ({
    items,
    isInteractable = false,
    onInteraction,
    onView,
}) => {
    if (!items) return null;
    console.log('onInteraction', onInteraction);
    console.log('onView', onView);
    return (
        <List>
            {items.map((task: AliceTask) => (
                <ListItem key={task._id}>
                    <ListItemText
                        primary={task.task_name}
                        secondary={
                            <>
                                <Typography component="span" variant="body2" color="textPrimary">
                                    Description: {task.task_description || 'N/A'}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2" color="textSecondary">
                                    Created: {new Date(task.createdAt || '').toLocaleString()}
                                </Typography>
                            </>
                        }
                    />
                    <Box>
                        {onView && (
                            <Tooltip title="View Task">
                                <IconButton edge="end" onClick={() => onView(task)}>
                                    <Visibility />
                                </IconButton>
                            </Tooltip>
                        )}
                        {onInteraction && (
                            <Tooltip title="Add Task">
                                <IconButton edge="end" onClick={() => onInteraction(task)}>
                                    <PlayArrow />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </ListItem>
            ))}
        </List>
    );
};

export default TaskListView;
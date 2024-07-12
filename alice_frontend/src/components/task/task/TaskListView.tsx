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
import { Visibility, ChevronRight } from '@mui/icons-material';
import { AliceTask, TaskComponentProps } from '../../../utils/TaskTypes';

const TaskListView: React.FC<TaskComponentProps> = ({
    items,
    isInteractable = false,
    onInteraction,
    onAddTask,
}) => {
    if (!items) return null;
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
                        {onInteraction && (
                            <Tooltip title="View Task">
                                <IconButton edge="end" onClick={() => onInteraction(task)}>
                                    <Visibility />
                                </IconButton>
                            </Tooltip>
                        )}
                        {onAddTask && (
                            <Tooltip title="Add Task">
                                <IconButton edge="end" onClick={() => onAddTask(task)}>
                                    <ChevronRight />
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
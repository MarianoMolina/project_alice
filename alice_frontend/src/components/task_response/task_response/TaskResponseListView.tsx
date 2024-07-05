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
import { Visibility } from '@mui/icons-material';
import { TaskResponse, TaskResponseComponentProps } from '../../../utils/TaskResponseTypes';

const TaskResponseListView: React.FC<TaskResponseComponentProps> = ({
    items,
    isInteractable = false,
    onInteraction,
}) => {
    if (!items) return null;
    return (
        <List>
            {items.map((taskResponse: TaskResponse) => (
                <ListItem key={taskResponse._id}>
                    <ListItemText
                        primary={taskResponse.task_name}
                        secondary={
                            <>
                                <Typography component="span" variant="body2" color="textPrimary">
                                    Status: {taskResponse.status || 'N/A'}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2" color="textSecondary">
                                    Created: {new Date(taskResponse.createdAt || '').toLocaleString()}
                                </Typography>
                            </>
                        }
                    />
                    <Box>
                        {isInteractable && onInteraction && (
                            <Tooltip title="View Agent">
                                <IconButton edge="end" onClick={() => onInteraction(taskResponse)}>
                                    <Visibility />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </ListItem>
            ))}
        </List>
    );
};

export default TaskResponseListView;
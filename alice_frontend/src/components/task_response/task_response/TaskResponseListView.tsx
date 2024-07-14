import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    IconButton,
    Tooltip,
    Chip
} from '@mui/material';
import { Visibility, PlayArrow } from '@mui/icons-material';
import { TaskResponse, TaskResponseComponentProps } from '../../../utils/TaskResponseTypes';

const TaskResponseListView: React.FC<TaskResponseComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const renderTaskResponse = (taskResponse: TaskResponse) => (
        <ListItem key={taskResponse._id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <ListItemText
                primary={
                    <Typography variant="subtitle1" component="div">
                        {taskResponse.task_name}
                        <Chip
                            label={taskResponse.status}
                            color={taskResponse.status === 'complete' ? 'success' : taskResponse.status === 'failed' ? 'error' : 'default'}
                            size="small"
                            sx={{ ml: 1 }}
                        />
                    </Typography>
                }
                secondary={
                    <>
                        <Typography component="span" variant="body2" color="text.primary">
                            {taskResponse.task_description}
                        </Typography>
                        <Typography component="div" variant="caption" color="text.secondary">
                            Created: {new Date(taskResponse.createdAt || '').toLocaleString()}
                        </Typography>
                    </>
                }
            />
            <Box>
                {onInteraction && (
                    <Tooltip title="Execute Task">
                        <IconButton edge="end" onClick={() => onInteraction(taskResponse)}>
                            <PlayArrow />
                        </IconButton>
                    </Tooltip>
                )}
                {onView && (
                    <Tooltip title="View Task Response">
                        <IconButton edge="end" onClick={() => onView(taskResponse)}>
                            <Visibility />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </ListItem>
    );

    if (item) {
        return <List>{renderTaskResponse(item)}</List>;
    }

    if (!items || items.length === 0) return null;

    return (
        <List>
            {items.map(renderTaskResponse)}
        </List>
    );
};

export default TaskResponseListView;
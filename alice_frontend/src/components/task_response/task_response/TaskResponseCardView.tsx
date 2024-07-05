import React from 'react';
import {
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Card,
    CardContent,
} from '@mui/material';
import { Category } from '@mui/icons-material';
import { TaskResponseComponentProps } from '../../../utils/TaskResponseTypes';

const TaskResponseCardView: React.FC<TaskResponseComponentProps> = ({
    item,
}) => {
    if (!item) {
        return <Typography>No chat data available.</Typography>;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6">Task: {item.task_name}</Typography>
                <Typography variant="body2">Status: {item.status}</Typography>
                <Typography variant="caption">
                    Model ID: {item._id}
                </Typography>
                <List>
                    <ListItemButton>
                        <ListItemIcon><Category /></ListItemIcon>
                        <ListItemText primary="Created at" secondary={new Date(item.createdAt || '').toDateString()} />
                    </ListItemButton>
                </List>
            </CardContent>
        </Card>
    );
};

export default TaskResponseCardView;
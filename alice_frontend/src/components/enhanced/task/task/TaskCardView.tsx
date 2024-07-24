import React from 'react';
import {
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Card,
    CardContent, 
    Box, 
} from '@mui/material';
import { Category, LibraryBooks, AddCircleOutline } from '@mui/icons-material';
import FunctionDefinitionBuilder from '../../common/function_select/Function';
import { TaskComponentProps } from '../../../../utils/TaskTypes';
import useStyles from '../TaskStyles';

const TaskCardView: React.FC<TaskComponentProps> = ({
    item,
}) => {
    const classes = useStyles();

    if (!item) {
        return <Typography>No chat data available.</Typography>;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" className={classes.title}>Active Task</Typography>
                <Typography variant="subtitle1">{item.task_name}</Typography>
                <Typography variant="body2">{item.task_description}</Typography>
                <Typography variant="caption" className={classes.taskId}>
                    Task ID: {item._id}
                </Typography>
                <List>
                    <ListItemButton>
                        <ListItemIcon><Category /></ListItemIcon>
                        <ListItemText primary="Task Type" secondary={item.task_type} />
                    </ListItemButton>
                    <ListItemButton>
                        <ListItemIcon><LibraryBooks /></ListItemIcon>
                        <ListItemText
                            primary="Templates"
                            secondary={`${Object.keys(item.templates || {}).length} template(s)`}
                        />
                    </ListItemButton>
                    <ListItemButton>
                        <ListItemIcon><AddCircleOutline /></ListItemIcon>
                        <ListItemText
                            primary="Prompts to Add"
                            secondary={`${Object.keys(item.prompts_to_add || {}).length} prompt(s)`}
                        />
                    </ListItemButton>
                </List>

                <Box>
                    <Typography gutterBottom>Parameters</Typography>
                    <FunctionDefinitionBuilder
                        initialParameters={item.input_variables || undefined}
                        isViewOnly={true}
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

export default TaskCardView;
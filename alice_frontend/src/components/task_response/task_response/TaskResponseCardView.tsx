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

    const renderOutput = (output: string | object): string => {
        if (typeof output === 'string') {
            return output;
        }
        if (typeof output === 'object') {
            return JSON.stringify(output, null, 2);
        }
        return 'Unknown output format';
    };

    const renderDiagnostic = (diagnostic: string | object): string => {
        if (typeof diagnostic === 'string') {
            return diagnostic;
        }
        if (typeof diagnostic === 'object') {
            return JSON.stringify(diagnostic, null, 2);
        }
        return 'Unknown diagnostic format';
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6">Task: {item.task_name}</Typography>
                <Typography variant="body2">Status: {item.status}</Typography>
                {item.result_code && (
                    <Typography variant="caption">Result Code: {item.result_code}</Typography>
                )}
                <List>
                    <ListItemButton>
                        <ListItemIcon><Category /></ListItemIcon>
                        <ListItemText
                            primary="Created at"
                            secondary={new Date(item.createdAt || '').toDateString()}
                        />
                    </ListItemButton>
                </List>

                {item.task_outputs && (
                    <Typography variant="body2">Output: {renderOutput(item.task_outputs)}</Typography>
                )}
                {item.result_diagnostic && (
                    <Typography variant="body2">Diagnostic: {renderDiagnostic(item.result_diagnostic)}</Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default TaskResponseCardView;

import React from 'react';
import {
    Card, CardContent, IconButton, TextField, CircularProgress,
    Typography, Alert, Box,
    Button
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { AliceTask, TaskComponentProps } from '../../../../types/TaskTypes';
import { useTask } from '../../../../context/TaskContext';
import { useCardDialog } from '../../../../context/CardDialogContext.tsx';
import useStyles from '../TaskStyles';

const TaskExecuteView: React.FC<TaskComponentProps> = ({
    item,
    onExecute,
}) => {
    const classes = useStyles();
    const {
        executionStatus,
        inputValues,
        handleInputChange,
        setSelectedTask,
        setInputValues,
    } = useTask();
    const { selectItem } = useCardDialog();

    if (!item) return null;

    const inputVariables = item.input_variables?.properties || {};

    const executeTask = async (inputs: any) => {
        if (!item || !onExecute) return;
        setSelectedTask(item as AliceTask);
        setInputValues(inputs);
        await onExecute();
    };

    const handleViewTask = () => {
        if (item._id) {
            selectItem('Task', item._id);
        }
    };

    return (
        <Card className={classes.taskCard}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6">{item.task_name}</Typography>
                    <IconButton
                        color="default"
                        onClick={handleViewTask}
                        size="small"
                        aria-label="view task details"
                    >
                        <VisibilityIcon />
                    </IconButton>
                </Box>
                <Typography variant="body2" mb={2}>{item.task_description || ''}</Typography>
                {inputVariables && Object.entries(inputVariables).map(([key, value]) => (
                    <TextField
                        key={key}
                        label={key}
                        value={inputValues[key] || ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        fullWidth
                        multiline
                        className={classes.inputField}
                        helperText={(value as any).description}
                    />
                ))}
                <Box className={classes.buttonContainer}>
                    <Button
                        color="primary"
                        onClick={() => executeTask(inputValues)}
                        disabled={executionStatus === 'progress'}
                        size="large"
                    >
                        {executionStatus === 'progress' ? <CircularProgress size={24} /> : 'Execute'}
                    </Button>
                </Box>
                <div className={classes.progressContainer}>
                    {executionStatus === 'success' && (
                        <Alert severity="success" className={classes.successMessage}>Task executed successfully!</Alert>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default TaskExecuteView;
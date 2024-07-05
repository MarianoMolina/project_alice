import React from 'react';
import {
    Card, CardContent, Button, TextField, CircularProgress,
    Typography,
} from '@mui/material';
import { AliceTask, TaskComponentProps } from '../../../utils/TaskTypes';
import useStyles from '../TaskStyles';
import { useTask } from '../../../context/TaskContext';

const TaskExecuteView: React.FC<TaskComponentProps> = ({
    item
}) => {
    if (!item) return null;
    const classes = useStyles()
    const { executionStatus, inputValues, handleInputChange, handleExecuteTask, setSelectedTask, setInputValues, selectedResult } = useTask();
    const inputVariables = item.input_variables?.properties || {};

    const executeTask = async (inputs: any) => {
        if (!item) return;
        setSelectedTask(item as AliceTask)
        setInputValues(inputs)
        await handleExecuteTask()
        return selectedResult
    };
    return (
        <Card className={classes.taskCard}>
            <CardContent>
                <Typography variant="h6">{item.task_name}</Typography>
                <Typography variant="body2">{item.task_description || ''}</Typography>
                {inputVariables && Object.entries(inputVariables).map(([key, value]) => (
                    <TextField
                        key={key}
                        label={key}
                        value={inputValues[key] || ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        fullWidth
                        className={classes.inputField}
                        helperText={(value as any).description}
                    />
                ))}
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => executeTask(inputVariables)}
                    className={classes.executeButton}
                    disabled={executionStatus === 'progress'}
                >
                    Execute Task
                </Button>
                <div className={classes.progressContainer}>
                    {executionStatus === 'progress' && (
                        <CircularProgress className={classes.progressIndicator} />
                    )}
                    {executionStatus === 'success' && (
                        <Typography>Task executed successfully!</Typography>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default TaskExecuteView;
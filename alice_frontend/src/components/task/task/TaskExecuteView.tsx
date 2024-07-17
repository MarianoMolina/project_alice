import React from 'react';
import {
    Card, CardContent, Button, TextField, CircularProgress,
    Typography, Accordion, AccordionSummary, AccordionDetails,
    Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AliceTask, TaskComponentProps } from '../../../utils/TaskTypes';
import useStyles from '../TaskStyles';
import { useTask } from '../../../context/TaskContext';

const TaskExecuteView: React.FC<TaskComponentProps> = ({
    item
}) => {
    const classes = useStyles();
    const { 
        executionStatus, 
        inputValues, 
        handleInputChange, 
        handleExecuteTask, 
        setSelectedTask, 
        setInputValues, 
    } = useTask();
    if (!item) return null;

    const inputVariables = item.input_variables?.properties || {};

    const executeTask = async (inputs: any) => {
        if (!item) return;
        setSelectedTask(item as AliceTask);
        setInputValues(inputs);
        await handleExecuteTask();
    };

    return (
        <Card className={classes.taskCard}>
            <CardContent>
                <Typography variant="h6">{item.task_name}</Typography>
                <Typography variant="body2">{item.task_description || ''}</Typography>
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Task Details</Typography>
                    </AccordionSummary>
                    <AccordionDetails className={classes.accordionDetails}>
                        <Typography className={classes.taskDetailItem}><strong>Type:</strong> {item.task_type}</Typography>
                        <Typography className={classes.taskDetailItem}><strong>Recursive:</strong> {item.recursive ? 'Yes' : 'No'}</Typography>
                        <Typography className={classes.taskDetailItem}><strong>Timeout:</strong> {item.timeout || 'Not set'}</Typography>
                        <Typography className={classes.taskDetailItem}><strong>Max Attempts:</strong> {item.max_attempts || 'Not set'}</Typography>
                        <Typography className={classes.taskDetailItem}><strong>Human Input:</strong> {item.human_input ? 'Required' : 'Not required'}</Typography>
                    </AccordionDetails>
                </Accordion>

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
                    onClick={() => executeTask(inputValues)}
                    className={classes.executeButton}
                    disabled={executionStatus === 'progress'}
                >
                    {executionStatus === 'progress' ? 'Executing...' : 'Execute Task'}
                </Button>

                <div className={classes.progressContainer}>
                    {executionStatus === 'progress' && (
                        <CircularProgress className={classes.progressIndicator} />
                    )}
                    {executionStatus === 'success' && (
                        <Alert severity="success">Task executed successfully!</Alert>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default TaskExecuteView;
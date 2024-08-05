import React from 'react';
import {
    Card, CardContent, Button, TextField, CircularProgress,
    Typography, Accordion, AccordionSummary, AccordionDetails,
    Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AliceTask, TaskComponentProps } from '../../../../utils/TaskTypes';
import useStyles from '../TaskStyles';
import { useTask } from '../../../../context/TaskContext';
import TaskCardView from './TaskCardView';

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
    if (!item) return null;

    const inputVariables = item.input_variables?.properties || {};

    const executeTask = async (inputs: any) => {
        if (!item || !onExecute) return;
        setSelectedTask(item as AliceTask);
        setInputValues(inputs);
        await onExecute();
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
                        <TaskCardView item={item} mode='view' items={null} onChange={() => {}} handleSave={()=>Promise.resolve()} />
                    </AccordionDetails>
                </Accordion>

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
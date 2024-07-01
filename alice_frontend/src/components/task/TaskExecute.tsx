import React from 'react';
import { Card, CardContent, TextField, Button, Typography, CircularProgress, Skeleton, Stack } from '@mui/material';
import { AliceTask } from '../../utils/types';
import useStyles from '../../styles/TaskExecuteStyles';

interface TaskExecuteProps {
  selectedTask: AliceTask | null;
  inputValues: { [key: string]: any };
  handleInputChange: (key: string, value: any) => void;
  handleExecuteTask: () => Promise<void>;
  executionStatus: 'idle' | 'progress' | 'success';
}

const TaskExecute: React.FC<TaskExecuteProps> = ({
  selectedTask,
  inputValues,
  handleInputChange,
  handleExecuteTask,
  executionStatus
}) => {
  const classes = useStyles();

  if (!selectedTask) {
    return (
      <Card className={classes.taskCard}>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">No task selected</Typography>
            <Typography>Please select a task from the sidebar to execute.</Typography>
            <Skeleton variant="rectangular" height={80} />
            <Skeleton variant="rounded" height={90} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={classes.taskCard}>
      <CardContent>
        <Typography variant="h6">{selectedTask.task_name}</Typography>
        <Typography variant="body2">{selectedTask.task_description}</Typography>
        {selectedTask.input_variables && Object.entries(selectedTask.input_variables.properties).map(([key, value]) => (
          <TextField
            key={key}
            label={key}
            value={inputValues[key] || ''}
            onChange={(e) => handleInputChange(key, e.target.value)}
            fullWidth
            className={classes.inputField}
            helperText={value.description}
          />
        ))}
        <Button
          variant="contained"
          color="primary"
          onClick={handleExecuteTask}
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

export default TaskExecute;
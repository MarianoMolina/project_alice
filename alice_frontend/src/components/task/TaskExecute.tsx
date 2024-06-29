import React from 'react';
import { Card, CardContent, Typography, TextField, Button } from '@mui/material';
import { AliceTask } from '../../utils/types';
import useStyles from '../../styles/StartTaskStyles';

interface TaskExecuteProps {
  selectedTask: AliceTask | null;
  inputValues: { [key: string]: any };
  handleInputChange: (key: string, value: any) => void;
  handleExecuteTask: () => void;
}

const TaskExecute: React.FC<TaskExecuteProps> = ({
  selectedTask,
  inputValues,
  handleInputChange,
  handleExecuteTask,
}) => {
  const classes = useStyles();

  if (!selectedTask || !selectedTask.input_variables) {
    return null;
  }

  return (
    <Card className={classes.taskCard}>
      <CardContent>
        <Typography variant="h6">{selectedTask.task_name}</Typography>
        <Typography variant="body2">{selectedTask.task_description}</Typography>
        {Object.entries(selectedTask.input_variables.properties).map(([key, value]) => (
          <TextField
            key={key}
            label={key}
            helperText={value.description}
            value={inputValues[key] || ''}
            onChange={(e) => handleInputChange(key, e.target.value)}
            fullWidth
            className={classes.inputField}
            type={value.type === 'number' ? 'number' : 'text'}
          />
        ))}
        <Button
          variant="contained"
          color="primary"
          onClick={handleExecuteTask}
          className={classes.executeButton}
        >
          Execute Task
        </Button>
      </CardContent>
    </Card>
  );
};

export default TaskExecute;
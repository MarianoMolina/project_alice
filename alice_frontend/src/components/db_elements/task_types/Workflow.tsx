import React from 'react';
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, SelectChangeEvent } from '@mui/material';
import { AliceTask, WorkflowForm } from '../../../utils/types';

interface WorkflowProps {
  form: WorkflowForm;
  setForm: React.Dispatch<React.SetStateAction<WorkflowForm>>;
  availableTasks: AliceTask[];
  viewOnly?: boolean;
}

const Workflow: React.FC<WorkflowProps> = ({ form, setForm, availableTasks, viewOnly }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleTasksChange = (event: SelectChangeEvent<string[]>) => {
    const selectedTaskIds = event.target.value as string[];
    const newTasks: { [key: string]: string } = {};
    selectedTaskIds.forEach(taskId => {
      const task = availableTasks.find(t => t._id === taskId);
      if (task) {
        newTasks[task.task_name] = taskId;
      }
    });
    setForm(prevForm => ({
      ...prevForm,
      tasks: newTasks
    }));
  };

  const handleStartTaskChange = (event: SelectChangeEvent<string>) => {
    setForm(prevForm => ({
      ...prevForm,
      start_task: event.target.value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: checked }));
  };

  const handleSubmit = () => {
    // TODO: Implement workflow creation logic
    console.log('Creating Workflow:', form);
  };

  return (
    <Box>
      <TextField
        fullWidth
        margin="normal"
        name="task_name"
        label="Workflow Name"
        value={form.task_name}
        onChange={handleInputChange}
        required
      />
      <TextField
        fullWidth
        margin="normal"
        name="task_description"
        label="Workflow Description"
        value={form.task_description}
        onChange={handleInputChange}
        multiline
        rows={3}
        required
      />
      <TextField
        fullWidth
        margin="normal"
        name="input_variables"
        label="Input Variables (JSON)"
        value={form.input_variables}
        onChange={handleInputChange}
        multiline
        rows={4}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>Tasks</InputLabel>
        <Select
          multiple
          value={Object.values(form.tasks || {})}  // Fix here: provide default empty object
          onChange={handleTasksChange}
          required
        >
          {availableTasks.map((task) => (
            <MenuItem key={task._id} value={task._id || ''}>
              {task.task_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Start Task</InputLabel>
        <Select
          value={form.start_task || ''}
          onChange={handleStartTaskChange}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {Object.entries(form.tasks || {}).map(([taskName, taskId]) => (
            <MenuItem key={taskId} value={taskId}>
              {taskName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        fullWidth
        margin="normal"
        name="max_attempts"
        label="Max Attempts"
        type="number"
        value={form.max_attempts}
        onChange={handleInputChange}
        inputProps={{ min: 1 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={form.recursive}
            onChange={handleCheckboxChange}
            name="recursive"
          />
        }
        label="Recursive"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: 2 }}
      >
        Create Workflow
      </Button>
    </Box>
  );
};

export default Workflow;

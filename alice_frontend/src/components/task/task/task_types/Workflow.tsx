import React from 'react';
import { Box, TextField, FormControl, InputLabel, Chip, MenuItem, Checkbox, FormControlLabel, SelectChangeEvent, Typography, Select } from '@mui/material';
import FunctionDefinitionBuilder from '../../../parameter/Function';
import { TaskFormProps, WorkflowForm, AliceTask } from '../../../../utils/TaskTypes';
import { FunctionParameters } from '../../../../utils/ParameterTypes';

const Workflow: React.FC<TaskFormProps<WorkflowForm>> = ({ form, setForm, availableTasks, viewOnly }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleTasksChange = (event: SelectChangeEvent<string[]>) => {
    const selectedTaskIds = event.target.value as string[];
    const newTasks: { [key: string]: AliceTask } = {};
    selectedTaskIds.forEach(taskId => {
      const task = availableTasks.find(t => t._id === taskId);
      if (task) {
        newTasks[task.task_name] = task;
      }
    });
    setForm({ ...form, tasks: newTasks });
  };

  const getSelectedTaskIds = () => {
    if (!form.tasks) {
      return [];
    }
    const selectedIds = Object.values(form.tasks).map(task => task._id || '');
    return selectedIds;
  };

  const handleStartTaskChange = (event: SelectChangeEvent<string>) => {
    const startTaskName = event.target.value;
    setForm({ ...form, start_task: startTaskName });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm({ ...form, [name]: checked });
  };
  const handleInputVariablesChange = (functionDefinition: FunctionParameters) => {
    setForm({ ...form, input_variables: functionDefinition });
  }

  return (
    <Box>
      <TextField
        fullWidth
        margin="normal"
        name="task_name"
        label="Workflow Name"
        value={form.task_name || ''}
        onChange={handleInputChange}
        required
        disabled={viewOnly}
      />
      <TextField
        fullWidth
        margin="normal"
        name="task_description"
        label="Workflow Description"
        value={form.task_description || ''}
        onChange={handleInputChange}
        multiline
        rows={3}
        required
        disabled={viewOnly}
      />
      <Box>
        <Typography gutterBottom>Input Variables</Typography>
        <FunctionDefinitionBuilder
          initialParameters={form.input_variables || undefined}
          onChange={handleInputVariablesChange}
          isViewOnly={viewOnly}
        />
      </Box>
      
      <FormControl fullWidth margin="normal" disabled={viewOnly}>
        <InputLabel>Tasks</InputLabel>
        <Select
          multiple
          value={getSelectedTaskIds()}
          onChange={handleTasksChange}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => {
                const task = availableTasks.find(t => t._id === value);
                console.log('[9-LOG] Rendering chip for task:', task?.task_name);
                return <Chip key={value} label={task ? task.task_name : value} />;
              })}
            </Box>
          )}
        >
          {availableTasks.map((task) => (
            <MenuItem key={task._id} value={task._id || ''}>
              {task.task_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal" disabled={viewOnly}>
        <InputLabel>Start Task</InputLabel>
        <Select
          value={form.start_task || ''}
          onChange={handleStartTaskChange}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {form.tasks && Object.values(form.tasks).map((task) => (
            <MenuItem key={task._id} value={task.task_name || ''}>
              {task.task_name}
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
        value={form.max_attempts || ''}
        onChange={handleInputChange}
        inputProps={{ min: 1 }}
        disabled={viewOnly}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={form.recursive || false}
            onChange={handleCheckboxChange}
            name="recursive"
            disabled={viewOnly}
          />
        }
        label="Recursive"
      />
    </Box>
  );
};

export default Workflow;
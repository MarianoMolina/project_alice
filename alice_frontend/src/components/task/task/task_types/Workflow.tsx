import React from 'react';
import { Box, TextField, FormControl, Checkbox, FormControlLabel, Typography } from '@mui/material';
import FunctionDefinitionBuilder from '../../../parameter/Function';
import { TaskFormProps, WorkflowForm, AliceTask } from '../../../../utils/TaskTypes';
import { FunctionParameters } from '../../../../utils/ParameterTypes';
import EnhancedTask from '../EnhancedTask';

const Workflow: React.FC<TaskFormProps<WorkflowForm>> = ({ form, setForm, viewOnly }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleTasksChange = (selectedTask: Partial<AliceTask>) => {
    if (selectedTask._id && selectedTask.task_name) {
      const newTasks = { ...form.tasks };
      if (selectedTask._id in newTasks) {
        delete newTasks[selectedTask._id];
      } else {
        newTasks[selectedTask._id] = selectedTask as AliceTask;
      }
      setForm({ ...form, tasks: newTasks });
    }
  };

  const handleStartTaskChange = (selectedTask: Partial<AliceTask>) => {
    if (selectedTask.task_name) {
      setForm({ ...form, start_task: selectedTask.task_name });
    }
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
        <Typography gutterBottom>Tasks</Typography>
        <EnhancedTask
          mode="list"
          fetchAll={true}
          onInteraction={handleTasksChange}
          isInteractable={!viewOnly}
        />
      </FormControl>
      <FormControl fullWidth margin="normal" disabled={viewOnly}>
        <Typography gutterBottom>Start Task</Typography>
        <EnhancedTask
          mode="list"
          fetchAll={false}
          itemId={form.start_task ? Object.keys(form.tasks).find(key => form.tasks[key].task_name === form.start_task) : undefined}
          onInteraction={handleStartTaskChange}
          isInteractable={!viewOnly}
        />
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
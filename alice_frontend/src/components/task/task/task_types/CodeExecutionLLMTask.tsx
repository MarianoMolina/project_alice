import React from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import PromptAgentTask from './PromptAgentTask';
import { CodeExecutionLLMTaskForm, TaskFormProps, PromptAgentTaskForm } from '../../../../utils/TaskTypes';

const CodeExecutionLLMTask: React.FC<TaskFormProps<CodeExecutionLLMTaskForm>> = ({ 
  form, 
  setForm, 
  viewOnly 
}) => {
  const handleBaseFormChange = (newBaseForm: PromptAgentTaskForm) => {
    setForm({ ...form, ...newBaseForm });
  };

  const handleValidLanguagesChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setForm({
      ...form,
      valid_languages: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleTimeoutChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      timeout: parseInt(event.target.value, 10),
    });
  };

  return (
    <Box>
      <PromptAgentTask 
        form={form} 
        setForm={handleBaseFormChange} 
        viewOnly={viewOnly}  
      />
     
      <FormControl fullWidth margin="normal">
        <InputLabel>Valid Languages</InputLabel>
        <Select
          multiple
          value={form.valid_languages}
          onChange={handleValidLanguagesChange}
        >
          <MenuItem value="python">Python</MenuItem>
          <MenuItem value="shell">Shell</MenuItem>
          <MenuItem value="javascript">JavaScript</MenuItem>
        </Select>
      </FormControl>
      <TextField
        fullWidth
        margin="normal"
        name="timeout"
        label="Timeout (seconds)"
        type="number"
        value={form.timeout}
        onChange={handleTimeoutChange}
        inputProps={{ min: 1 }}
      />
    </Box>
  );
};

export default CodeExecutionLLMTask;
import React from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import PromptAgentTask from './PromptAgentTask';
import { CodeExecutionLLMTaskForm, TaskFormProps } from '../../../../utils/TaskTypes';

const CodeExecutionLLMTask: React.FC<TaskFormProps<CodeExecutionLLMTaskForm>> = ({ form, setForm, agents, prompts, availableTasks, viewOnly }) => {
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
      <PromptAgentTask form={form} setForm={setForm} agents={agents} prompts={prompts}  availableTasks={availableTasks} viewOnly={viewOnly}  />
     
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
          <MenuItem value="ruby">Ruby</MenuItem>
          <MenuItem value="java">Java</MenuItem>
          <MenuItem value="cpp">C++</MenuItem>
          <MenuItem value="csharp">C#</MenuItem>
          <MenuItem value="go">Go</MenuItem>
          <MenuItem value="rust">Rust</MenuItem>
          <MenuItem value="php">PHP</MenuItem>
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
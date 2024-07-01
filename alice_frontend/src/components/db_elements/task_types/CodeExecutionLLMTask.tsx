import React from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import PromptAgentTask from './PromptAgentTask';
import { AliceAgent, Prompt, CodeExecutionLLMTaskForm } from '../../../utils/types';

interface CodeExecutionLLMTaskProps {
  form: CodeExecutionLLMTaskForm;
  setForm: React.Dispatch<React.SetStateAction<CodeExecutionLLMTaskForm>>;
  agents: AliceAgent[];
  prompts: Prompt[];
}

const CodeExecutionLLMTask: React.FC<CodeExecutionLLMTaskProps> = ({ form, setForm, agents, prompts }) => {
  const handleValidLanguagesChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setForm((prevForm) => ({
      ...prevForm,
      valid_languages: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleTimeoutChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prevForm) => ({
      ...prevForm,
      timeout: parseInt(event.target.value, 10),
    }));
  };

  return (
    <Box>
      <PromptAgentTask form={form} setForm={setForm} agents={agents} prompts={prompts} />
     
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
import React from 'react';
import { Box, TextField, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { AliceAgent, Prompt, PromptAgentTaskForm } from '../../../utils/types';

interface BasicAgentTaskProps {
  form: PromptAgentTaskForm;
  setForm: React.Dispatch<React.SetStateAction<PromptAgentTaskForm>>;
  agents: AliceAgent[];
  prompts: Prompt[];
}

const BasicAgentTask: React.FC<BasicAgentTaskProps> = ({ form, setForm, agents, prompts }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: checked }));
  };

  const handleAgentChange = (e: SelectChangeEvent<string>) => {
    setForm((prevForm) => ({ ...prevForm, agent_id: e.target.value }));
  };

  return (
    <Box>
      <TextField
        fullWidth
        margin="normal"
        name="task_name"
        label="Task Name"
        value={form.task_name}
        onChange={handleInputChange}
        required
      />
      <TextField
        fullWidth
        margin="normal"
        name="task_description"
        label="Task Description"
        value={form.task_description}
        onChange={handleInputChange}
        multiline
        rows={3}
        required
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>Agent</InputLabel>
        <Select value={form.agent_id} onChange={handleAgentChange} required>
          {agents.map((agent) => (
            <MenuItem key={agent._id} value={agent._id || ''}>
              {agent.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Checkbox
            checked={form.human_input}
            onChange={handleCheckboxChange}
            name="human_input"
          />
        }
        label="Requires Human Input"
      />
    </Box>
  );
};

export default BasicAgentTask;
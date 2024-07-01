import React from 'react';
import { Box, TextField, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { AliceAgent, Prompt, PromptAgentTaskForm } from '../../../utils/types';

interface PromptAgentTaskProps<T extends PromptAgentTaskForm> {
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  agents: AliceAgent[];
  prompts: Prompt[];
}

function PromptAgentTask<T extends PromptAgentTaskForm>({ form, setForm, agents, prompts }: PromptAgentTaskProps<T>) {
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

  const handleTemplateChange = (e: SelectChangeEvent<string>) => {
    setForm((prevForm) => ({
      ...prevForm,
      templates: { ...prevForm.templates, task_template: e.target.value },
    }));
  };

  const handlePromptToAddChange = (e: SelectChangeEvent<string[]>) => {
    const selectedPromptIds = e.target.value as string[];
    setForm((prevForm) => {
      const newPromptsToAdd: Record<string, string> = {};
      selectedPromptIds.forEach(id => {
        newPromptsToAdd[id] = '';
      });
      return { ...prevForm, prompts_to_add: newPromptsToAdd };
    });
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
        <InputLabel>Task Template</InputLabel>
        <Select
          value={form.templates.task_template}
          onChange={handleTemplateChange}
          required
        >
          {prompts.map((prompt) => (
            <MenuItem key={prompt._id} value={prompt._id || ''}>
              {prompt.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Prompts to Add</InputLabel>
        <Select
          multiple
          value={Object.keys(form.prompts_to_add || {})}
          onChange={handlePromptToAddChange}
          renderValue={(selected) => (selected as string[]).join(', ')}
        >
          {prompts.map((prompt) => (
            <MenuItem key={prompt._id} value={prompt._id || ''}>
              <Checkbox checked={!!form.prompts_to_add?.[prompt._id || '']} />
              {prompt.name}
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

export default PromptAgentTask;
import React from 'react';
import { Box, TextField, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { TaskFormProps, PromptAgentTaskForm } from '../../../../utils/TaskTypes';

const BasicAgentTask: React.FC<TaskFormProps<PromptAgentTaskForm>> = ({ form, setForm, agents, prompts, availableTasks, viewOnly }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm({ ...form, [name]: checked });
  };

  const handleAgentChange = (e: SelectChangeEvent<string>) => {
    setForm({ ...form, agent_id: e.target.value });
  };

  return (
    <Box>
      <TextField
        fullWidth
        margin="normal"
        name="task_name"
        label="Task Name"
        value={form.task_name || ''}
        onChange={handleInputChange}
        required
        disabled={viewOnly}
      />
      <TextField
        fullWidth
        margin="normal"
        name="task_description"
        label="Task Description"
        value={form.task_description || ''}
        onChange={handleInputChange}
        multiline
        rows={3}
        required
        disabled={viewOnly}
      />
      <FormControl fullWidth margin="normal" disabled={viewOnly}>
        <InputLabel>Agent</InputLabel>
        <Select value={form.agent_id || ''} onChange={handleAgentChange} required>
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
            checked={form.human_input || false}
            onChange={handleCheckboxChange}
            name="human_input"
            disabled={viewOnly}
          />
        }
        label="Requires Human Input"
      />
    </Box>
  );
};

export default BasicAgentTask;
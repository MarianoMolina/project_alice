import React from 'react';
import { Box, TextField, FormControlLabel, Checkbox, FormControl, InputLabel } from '@mui/material';
import { TaskFormProps, PromptAgentTaskForm } from '../../../../utils/TaskTypes';
import EnhancedAgent from '../../../agent/agent/EnhancedAgent';
import { AliceAgent } from '../../../../utils/AgentTypes';

const BasicAgentTask: React.FC<TaskFormProps<PromptAgentTaskForm>> = ({ form, setForm, viewOnly }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm({ ...form, [name]: checked });
  };

  const handleAgentChange = (selectedAgent: Partial<AliceAgent>) => {
    setForm({ ...form, agent: selectedAgent as AliceAgent });
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
        <EnhancedAgent
          mode="list"
          fetchAll={true}
          onInteraction={handleAgentChange}
          isInteractable={!viewOnly}
        />
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
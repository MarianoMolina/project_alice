import React from 'react';
import { 
  Box, 
  TextField, 
  FormControlLabel, 
  Checkbox, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent, 
  Typography, 
  Chip 
} from '@mui/material';
import { TaskFormProps, PromptAgentTaskForm } from '../../../../utils/TaskTypes';
import FunctionDefinitionBuilder from '../../../parameter/Function';
import { FunctionParameters } from '../../../../utils/ParameterTypes';
import PromptAdder from '../../../prompt/PromptAdder';

const PromptAgentTask: React.FC<TaskFormProps<PromptAgentTaskForm>> = ({ 
  form, 
  setForm, 
  agents, 
  prompts, 
  viewOnly 
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm({ ...form, [name]: checked });
  };

  const handleAgentChange = (e: SelectChangeEvent<string>) => {
    const newAgentId = e.target.value;
    const newAgent = agents.find(agent => agent._id === newAgentId) || null;
    setForm({ ...form, agent_id: newAgent });
  };

  const handleTemplateChange = (e: SelectChangeEvent<string>) => {
    const newTemplateId = e.target.value;
    const newTemplate = prompts.find(prompt => prompt._id === newTemplateId);
    if (!newTemplate) return;
    setForm({
      ...form,
      templates: { ...form.templates, task_template: newTemplate },
    });
  };

  const handleInputVariablesChange = (functionDefinition: FunctionParameters) => {
    console.log('functionDefinition:', functionDefinition)
    setForm({ ...form, input_variables: functionDefinition });
  }

  const handlePromptAdd = (name: string, promptId: string) => {
    const newPrompt = prompts.find(prompt => prompt._id === promptId);
    if (newPrompt) {
      setForm({
        ...form,
        prompts_to_add: { ...form.prompts_to_add, [name]: newPrompt }
      });
    }
  };

  const handlePromptRemove = (name: string) => {
    const newPromptsToAdd = { ...form.prompts_to_add };
    delete newPromptsToAdd[name];
    setForm({ ...form, prompts_to_add: newPromptsToAdd });
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
        <Select 
          value={form.agent_id?._id || ''} 
          onChange={handleAgentChange} 
          required
        >
          {agents.map((agent) => (
            <MenuItem key={agent._id} value={agent._id || ''}>
              {agent.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box>
        <Typography gutterBottom>Input Variables</Typography>
        <FunctionDefinitionBuilder
          initialParameters={form.input_variables || undefined}
          onChange={handleInputVariablesChange}
          isViewOnly={viewOnly}
        />
      </Box>
      <FormControl fullWidth margin="normal" disabled={viewOnly}>
        <InputLabel>Task Template</InputLabel>
        <Select
          value={form.templates?.task_template?._id || ''}
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
      <Box>
        <Typography gutterBottom>Prompts to Add</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {Object.entries(form.prompts_to_add || {}).map(([name, prompt]) => (
            <Chip
              key={name}
              label={`${name}: ${prompt.name}`}
              onDelete={() => handlePromptRemove(name)}
              disabled={viewOnly}
            />
          ))}
        </Box>
        {!viewOnly && <PromptAdder prompts={prompts} onAdd={handlePromptAdd} />}
      </Box>
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
}

export default PromptAgentTask;
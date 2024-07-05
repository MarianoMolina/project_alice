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
import { getFieldId } from '../../../../utils/DBUtils';

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
    setForm({ ...form, agent_id: e.target.value });
  };

  const handleTemplateChange = (e: SelectChangeEvent<string>) => {
    setForm({
      ...form,
      templates: new Map(form.templates || new Map()).set('task_template', e.target.value),
    });
  };

  const handleInputVariablesChange = (functionDefinition: FunctionParameters) => {
    console.log('functionDefinition:', functionDefinition)
    setForm({ ...form, input_variables: functionDefinition });
  }

  const handlePromptAdd = (name: string, promptId: string) => {
    setForm({
      ...form,
      prompts_to_add: new Map(form.prompts_to_add || new Map()).set(name, promptId)
    });
  };

  const handlePromptRemove = (name: string) => {
    const newPromptsToAdd = new Map(form.prompts_to_add || new Map());
    newPromptsToAdd.delete(name);
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
          value={getFieldId(form.agent_id) || ''} 
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
          value={getFieldId(form.templates?.get('task_template')) || ''}
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
          {Array.from(form.prompts_to_add || new Map()).map(([name, promptId]) => (
            <Chip
              key={name}
              label={`${name}: ${prompts.find(p => p._id === getFieldId(promptId))?.name}`}
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
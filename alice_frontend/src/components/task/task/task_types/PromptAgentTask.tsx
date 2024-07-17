import React from 'react';
import { 
  Box, 
  TextField, 
  FormControlLabel, 
  Checkbox, 
  FormControl, 
  InputLabel, 
  Typography, 
  Chip 
} from '@mui/material';
import { TaskFormProps, PromptAgentTaskForm } from '../../../../utils/TaskTypes';
import FunctionDefinitionBuilder from '../../../parameter/Function';
import { FunctionParameters } from '../../../../utils/ParameterTypes';
import EnhancedAgent from '../../../agent/agent/EnhancedAgent';
import EnhancedPrompt from '../../../prompt/prompt/EnhancedPrompt';
import { AliceAgent } from '../../../../utils/AgentTypes';
import { Prompt } from '../../../../utils/PromptTypes';

const PromptAgentTask: React.FC<TaskFormProps<PromptAgentTaskForm>> = ({ 
  form, 
  setForm, 
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

  const handleAgentChange = (selectedAgent: Partial<AliceAgent>) => {
    setForm({ ...form, agent: selectedAgent as AliceAgent });
  };

  const handleTemplateChange = (selectedPrompt: Partial<Prompt>) => {
    if (selectedPrompt) {
      setForm({
        ...form,
        templates: { ...form.templates, task_template: selectedPrompt as Prompt },
      });
    }
  };

  const handleInputVariablesChange = (functionDefinition: FunctionParameters) => {
    console.log('functionDefinition:', functionDefinition)
    setForm({ ...form, input_variables: functionDefinition });
  }
  const handlePromptAdd = (name: string, promptId: string) => {
    const newPrompt = form.prompts_to_add && typeof form.prompts_to_add === 'object' 
      ? Object.values(form.prompts_to_add).find((prompt: Prompt) => prompt._id === promptId)
      : undefined;

    if (newPrompt) {
      setForm({
        ...form,
        prompts_to_add: { ...(form.prompts_to_add as Record<string, Prompt>), [name]: newPrompt }
      });
    }
  };

  const handlePromptRemove = (name: string) => {
    if (form.prompts_to_add && typeof form.prompts_to_add === 'object') {
      const newPromptsToAdd = { ...form.prompts_to_add };
      delete newPromptsToAdd[name];
      setForm({ ...form, prompts_to_add: newPromptsToAdd });
    }
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
        <EnhancedPrompt
          mode="list"
          fetchAll={true}
          onInteraction={handleTemplateChange}
          isInteractable={!viewOnly}
        />
      </FormControl>
      <Box>
        <Typography gutterBottom>Prompts to Add</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {form.prompts_to_add && typeof form.prompts_to_add === 'object' && Object.entries(form.prompts_to_add).map(([name, prompt]) => (
            <Chip
              key={name}
              label={`${name}: ${prompt.name}`}
              onDelete={() => handlePromptRemove(name)}
              disabled={viewOnly}
            />
          ))}
        </Box>
        {!viewOnly && (
          <EnhancedPrompt
            mode="list"
            fetchAll={true}
            onInteraction={(selectedPrompt: Partial<Prompt>) => {
              if (selectedPrompt._id && selectedPrompt.name) {
                handlePromptAdd(selectedPrompt.name, selectedPrompt._id);
              }
            }}
            isInteractable={true}
          />
        )}
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
import React from 'react';
import { Box } from '@mui/material';
import PromptAgentTask from './PromptAgentTask';
import { CodeGenerationLLMTaskForm, TaskFormProps, PromptAgentTaskForm } from '../../../../utils/TaskTypes';

const CodeGenerationLLMTask: React.FC<TaskFormProps<CodeGenerationLLMTaskForm>> = ({ form, setForm, agents, prompts, availableTasks, viewOnly }) => {
  const handleBaseFormChange = (newBaseForm: PromptAgentTaskForm) => {
    setForm({ ...form, ...newBaseForm });
  };
  return (
    <Box>
      <PromptAgentTask form={form} setForm={handleBaseFormChange} agents={agents} prompts={prompts} availableTasks={availableTasks} viewOnly={viewOnly} />
    </Box>
  );
};

export default CodeGenerationLLMTask;

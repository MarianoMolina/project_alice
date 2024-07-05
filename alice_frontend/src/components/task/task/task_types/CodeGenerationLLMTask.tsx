import React from 'react';
import { Box } from '@mui/material';
import PromptAgentTask from './PromptAgentTask';
import { CodeGenerationLLMTaskForm, TaskFormProps } from '../../../../utils/TaskTypes';

const CodeGenerationLLMTask: React.FC<TaskFormProps<CodeGenerationLLMTaskForm>> = ({ form, setForm, agents, prompts, availableTasks, viewOnly }) => {
  return (
    <Box>
      <PromptAgentTask form={form} setForm={setForm} agents={agents} prompts={prompts} availableTasks={availableTasks} viewOnly={viewOnly} />
    </Box>
  );
};

export default CodeGenerationLLMTask;

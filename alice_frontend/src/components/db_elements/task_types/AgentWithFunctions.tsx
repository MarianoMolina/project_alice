import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import PromptAgentTask from './PromptAgentTask';
import { AliceAgent, AliceTask, Prompt, AgentWithFunctionsForm } from '../../../utils/types';

interface AgentWithFunctionsProps {
  form: AgentWithFunctionsForm;
  setForm: React.Dispatch<React.SetStateAction<AgentWithFunctionsForm>>;
  agents: AliceAgent[];
  prompts: Prompt[];
  availableTasks: AliceTask[];
}

const AgentWithFunctions: React.FC<AgentWithFunctionsProps> = ({ form, setForm, agents, prompts, availableTasks }) => {
  const handleTasksChange = (event: SelectChangeEvent<string[]>) => {
    const selectedTaskIds = event.target.value as string[];
    const newTasks: { [key: string]: string } = {};
    selectedTaskIds.forEach(taskId => {
      const task = availableTasks.find(t => t._id === taskId);
      if (task) {
        newTasks[task.task_name] = taskId;
      }
    });
    setForm(prevForm => ({
      ...prevForm,
      tasks: newTasks
    }));
  };

  const handleExecutionAgentChange = (event: SelectChangeEvent<string>) => {
    setForm(prevForm => ({
      ...prevForm,
      execution_agent_id: event.target.value
    }));
  };

  return (
    <Box>
      <PromptAgentTask form={form} setForm={setForm} agents={agents} prompts={prompts} />
     
      <FormControl fullWidth margin="normal">
        <InputLabel>Tasks</InputLabel>
        <Select
          multiple
          value={Object.values(form.tasks || {})}
          onChange={handleTasksChange}
        >
          {availableTasks.map((task) => (
            <MenuItem key={task._id} value={task._id || ''}>
              {task.task_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Execution Agent</InputLabel>
        <Select
          value={form.execution_agent_id}
          onChange={handleExecutionAgentChange}
        >
          {agents.map((agent) => (
            <MenuItem key={agent._id} value={agent._id || ''}>
              {agent.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default AgentWithFunctions;
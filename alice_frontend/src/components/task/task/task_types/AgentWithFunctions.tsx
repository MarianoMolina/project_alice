import React, { useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Chip } from '@mui/material';
import PromptAgentTask from './PromptAgentTask';
import { AgentWithFunctionsForm, TaskFormProps } from '../../../../utils/TaskTypes';
import { getFieldId } from '../../../../utils/DBUtils';

const AgentWithFunctions: React.FC<TaskFormProps<AgentWithFunctionsForm>> = ({
  form,
  setForm,
  agents,
  prompts,
  availableTasks,
  viewOnly
}) => {
  useEffect(() => {
    console.log('[1-LOG] Initial form state:', form);
  }, []);

  const handleTasksChange = (event: SelectChangeEvent<string[]>) => {
    const selectedTaskIds = event.target.value as string[];
    const newTasks: Map<string, string> = new Map();

    selectedTaskIds.forEach(taskId => {
      const task = availableTasks.find(t => t._id === taskId);
      if (task) {
        newTasks.set(task.task_name, taskId);
      }
    });

    setForm({ ...form, tasks: newTasks });
  };

  const handleExecutionAgentChange = (event: SelectChangeEvent<string>) => {
    const newExecutionAgentId = event.target.value;
    console.log('[5-LOG] New execution agent ID:', newExecutionAgentId);
    setForm({ ...form, execution_agent_id: newExecutionAgentId });
  };

  const getSelectedTaskIds = () => {
    if (!form.tasks) {
      console.log('[6-LOG] No tasks selected');
      return [];
    }
    const selectedIds = Array.from(form.tasks.values());
    console.log('[7-LOG] Selected task IDs:', selectedIds);
    return selectedIds;
  };

  useEffect(() => {
    console.log('[8-LOG] Current form state:', form);
  }, [form]);

  return (
    <Box>
      <PromptAgentTask
        form={form}
        setForm={setForm}
        agents={agents}
        prompts={prompts}
        availableTasks={availableTasks}
        viewOnly={viewOnly}
      />
     
      <FormControl fullWidth margin="normal" disabled={viewOnly}>
        <InputLabel>Tasks</InputLabel>
        <Select
          multiple
          value={getSelectedTaskIds()}
          onChange={handleTasksChange}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => {
                const task = availableTasks.find(t => t._id === value);
                console.log('[9-LOG] Rendering chip for task:', task?.task_name);
                return <Chip key={value} label={task ? task.task_name : value} />;
              })}
            </Box>
          )}
        >
          {availableTasks.map((task) => (
            <MenuItem key={task._id} value={task._id || ''}>
              {task.task_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal" disabled={viewOnly}>
        <InputLabel>Execution Agent</InputLabel>
        <Select
          value={getFieldId(form.execution_agent_id) || ''}
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

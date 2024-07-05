import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { CheckTaskForm, TaskFormProps } from '../../../../utils/TaskTypes';
import PromptAgentTask from './PromptAgentTask';

const CheckTask: React.FC<TaskFormProps<CheckTaskForm>> = ({ form, setForm, agents, prompts, availableTasks, viewOnly }) => {
  const handleExitCodeResponseMapChange = (key: string, value: string) => {
    // Create a new Map from the existing one to maintain immutability
    const newMap = new Map(form.exit_code_response_map);
  
    // Update the map with the new key-value pair
    newMap.set(key, parseInt(value, 10));
  
    // Update the form state with the new map
    setForm({
      ...form,
      exit_code_response_map: newMap,
    });
  };
  return (
    <Box>
      <PromptAgentTask form={form as CheckTaskForm} setForm={setForm} agents={agents} prompts={prompts}  availableTasks={availableTasks} viewOnly={viewOnly}  />
     
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Exit Code Response Map</Typography>
        {Object.entries(form.exit_code_response_map || {}).map(([key, value]) => (
          <Box key={key} sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField
              label="Response"
              value={key}
              onChange={(e) => handleExitCodeResponseMapChange(e.target.value, value.toString())}
              disabled={viewOnly}
            />
            <TextField
              label="Exit Code"
              type="number"
              value={value}
              onChange={(e) => handleExitCodeResponseMapChange(key, e.target.value)}
              disabled={viewOnly}
            />
          </Box>
        ))}
        {!viewOnly && (
          <Button
            variant="outlined"
            onClick={() => handleExitCodeResponseMapChange('NEW_RESPONSE', '0')}
            sx={{ mt: 1 }}
          >
            Add Response
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default CheckTask;
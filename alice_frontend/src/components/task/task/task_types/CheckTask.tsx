import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { CheckTaskForm, TaskFormProps, PromptAgentTaskForm } from '../../../../utils/TaskTypes';
import PromptAgentTask from './PromptAgentTask';

const CheckTask: React.FC<TaskFormProps<CheckTaskForm>> = ({ form, setForm, agents, prompts, availableTasks, viewOnly }) => {
  const handleBaseFormChange = (newBaseForm: PromptAgentTaskForm) => {
    setForm({ ...form, ...newBaseForm });
  };

  const handleExitCodeResponseMapChange = (key: string, value: string) => {
    const newExitCodeResponseMap = { ...form.exit_code_response_map };
    
    if (value === '') {
      delete newExitCodeResponseMap[key];
    } else {
      newExitCodeResponseMap[key] = parseInt(value, 10);
    }

    setForm({
      ...form,
      exit_code_response_map: newExitCodeResponseMap,
    });
  };

  const addNewResponse = () => {
    const newKey = `NEW_RESPONSE_${Object.keys(form.exit_code_response_map || {}).length + 1}`;
    handleExitCodeResponseMapChange(newKey, '0');
  };

  return (
    <Box>
      <PromptAgentTask 
        form={form} 
        setForm={handleBaseFormChange} 
        agents={agents} 
        prompts={prompts}  
        availableTasks={availableTasks} 
        viewOnly={viewOnly}
      />
     
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Exit Code Response Map</Typography>
        {Object.entries(form.exit_code_response_map || {}).map(([key, value]) => (
          <Box key={key} sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField
              label="Response"
              value={key}
              onChange={(e) => {
                const oldValue = form.exit_code_response_map?.[key];
                handleExitCodeResponseMapChange(e.target.value, oldValue?.toString() || '0');
                if (key !== e.target.value) {
                  handleExitCodeResponseMapChange(key, '');
                }
              }}
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
            onClick={addNewResponse}
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
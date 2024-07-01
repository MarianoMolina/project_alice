import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { AliceAgent, Prompt, CheckTaskForm } from '../../../utils/types';
import PromptAgentTask from './PromptAgentTask';

interface CheckTaskProps {
  form: CheckTaskForm;
  setForm: React.Dispatch<React.SetStateAction<CheckTaskForm>>;
  agents: AliceAgent[];
  prompts: Prompt[];
}

const CheckTask: React.FC<CheckTaskProps> = ({ form, setForm, agents, prompts }) => {
  const handleExitCodeResponseMapChange = (key: string, value: string) => {
    setForm((prevForm) => ({
      ...prevForm,
      exit_code_response_map: {
        ...prevForm.exit_code_response_map,
        [key]: parseInt(value, 10),
      },
    }));
  };

  return (
    <Box>
      <PromptAgentTask<CheckTaskForm> form={form} setForm={setForm} agents={agents} prompts={prompts} />
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Exit Code Response Map</Typography>
        {Object.entries(form.exit_code_response_map || {}).map(([key, value]) => (
          <Box key={key} sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField
              label="Response"
              value={key}
              onChange={(e) => handleExitCodeResponseMapChange(e.target.value, value.toString())}
            />
            <TextField
              label="Exit Code"
              type="number"
              value={value}
              onChange={(e) => handleExitCodeResponseMapChange(key, e.target.value)}
            />
          </Box>
        ))}
        <Button
          variant="outlined"
          onClick={() => handleExitCodeResponseMapChange('NEW_RESPONSE', '0')}
          sx={{ mt: 1 }}
        >
          Add Response
        </Button>
      </Box>
    </Box>
  );
};

export default CheckTask;

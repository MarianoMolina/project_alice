import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { TaskFormsProps } from '../../../../../types/TaskTypes';
import PromptAgentTask from './PromptAgentTask';

const CheckTask: React.FC<TaskFormsProps> = ({ item, onChange, mode, handleAccordionToggle, activeAccordion, handleSave, apis }) => {
  const isEditMode = mode === 'edit' || mode === 'create';

  if (!item) {
    return <Box>No task data available.</Box>;
  }

  const handleExitCodeResponseMapChange = (key: string, value: string) => {
    const newExitCodeResponseMap = { ...item.exit_code_response_map };
   
    if (value === '') {
      delete newExitCodeResponseMap[key];
    } else {
      newExitCodeResponseMap[key] = parseInt(value, 10);
    }
    onChange({
      ...item,
      exit_code_response_map: newExitCodeResponseMap,
    });
  };

  const addNewResponse = () => {
    const newKey = `NEW_RESPONSE_${Object.keys(item.exit_code_response_map || {}).length + 1}`;
    handleExitCodeResponseMapChange(newKey, '0');
  };

  return (
    <Box>
      <PromptAgentTask
        apis={apis}
        items={null}
        handleSave={handleSave}
        item={item}
        onChange={onChange}
        mode={mode}
        handleAccordionToggle={handleAccordionToggle}
        activeAccordion={activeAccordion}
      />
     
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Exit Code Response Map</Typography>
        {Object.entries(item.exit_code_response_map || {}).map(([key, value]) => (
          <Box key={key} sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField
              label="Response"
              value={key}
              onChange={(e) => {
                const oldValue = item.exit_code_response_map?.[key];
                handleExitCodeResponseMapChange(e.target.value, oldValue?.toString() || '0');
                if (key !== e.target.value) {
                  handleExitCodeResponseMapChange(key, '');
                }
              }}
              disabled={!isEditMode}
            />
            <TextField
              label="Exit Code"
              type="number"
              value={value}
              onChange={(e) => handleExitCodeResponseMapChange(key, e.target.value)}
              disabled={!isEditMode}
            />
          </Box>
        ))}
        {!!isEditMode && (
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
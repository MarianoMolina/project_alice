import React from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import PromptAgentTask from './PromptAgentTask';
import { TaskFormsProps } from '../../../../../types/TaskTypes';

const CodeExecutionLLMTask: React.FC<TaskFormsProps> = ({
  item, onChange, mode, handleAccordionToggle, activeAccordion, handleSave, apis
}) => {
  const isEditMode = mode === 'edit' || mode === 'create';

  if (!item) {
    return <Box>No task data available.</Box>;
  }

  const handleValidLanguagesChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    onChange({
      ...item,
      valid_languages: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleTimeoutChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...item,
      timeout: parseInt(event.target.value, 10),
    });
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

      <FormControl fullWidth margin="normal">
        <InputLabel>Valid Languages</InputLabel>
        <Select
          multiple
          value={item.valid_languages}
          onChange={handleValidLanguagesChange}
          disabled={!isEditMode}
        >
          <MenuItem value="python">Python</MenuItem>
          <MenuItem value="shell">Shell</MenuItem>
          <MenuItem value="javascript">JavaScript</MenuItem>
        </Select>
      </FormControl>
      <TextField
        fullWidth
        margin="normal"
        name="timeout"
        label="Timeout (seconds)"
        type="number"
        value={item.timeout}
        onChange={handleTimeoutChange}
        inputProps={{ min: 1 }}
        disabled={!isEditMode}
      />
    </Box>
  );
};

export default CodeExecutionLLMTask;
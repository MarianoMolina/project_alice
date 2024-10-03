import React, { useMemo, useRef } from 'react';
import { Box, TextField, FormControlLabel, Checkbox } from '@mui/material';
import { TaskFormsProps } from '../../../../../types/TaskTypes';
import PromptAgentTask from './PromptAgentTask';

const Workflow: React.FC<TaskFormsProps> = ({
  item,
  onChange,
  mode,
  handleAccordionToggle,
  activeAccordion,
  handleSave,
  apis
}) => {
  const isEditMode = mode === 'edit' || mode === 'create';

  const itemRef = useRef(item);
  const onChangeRef = useRef(onChange);

  // Update refs when props change
  itemRef.current = item;
  onChangeRef.current = onChange;

  const memoizedBasicAgentTask = useMemo(() => (
    <PromptAgentTask
      apis={apis}
      handleSave={handleSave}
      items={null}
      item={itemRef.current}
      onChange={onChangeRef.current}
      mode={mode}
      handleAccordionToggle={handleAccordionToggle}
      activeAccordion={activeAccordion}
    />
  ), [mode, handleSave, handleAccordionToggle, activeAccordion, apis]);


  if (!item) {
    return <Box>No task data available.</Box>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ ...item, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onChange({ ...item, [name]: checked });
  };
  return (
    <Box>
      {memoizedBasicAgentTask}
      <TextField
        fullWidth
        margin="normal"
        name="max_attempts"
        label="Max Attempts"
        type="number"
        value={item.max_attempts || ''}
        onChange={handleInputChange}
        inputProps={{ min: 1 }}
        disabled={!isEditMode}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={item.recursive || false}
            onChange={handleCheckboxChange}
            name="recursive"
            disabled={!isEditMode}
          />
        }
        label="Recursive"
      />
    </Box>
  );
};

export default Workflow;
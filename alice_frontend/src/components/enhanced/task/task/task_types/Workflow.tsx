import React, { useMemo, useRef } from 'react';
import { Box, TextField, FormControlLabel, Checkbox, Typography, Tooltip } from '@mui/material';
import { TaskFormsProps } from '../../../../../types/TaskTypes';
import PromptAgentTask from './PromptAgentTask';
import TaskEndCodeRoutingBuilder from '../../../common/task_end_code_routing/TaskEndCodeRoutingBuilder';

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

  const memoizedPromptAgentTask = useMemo(() => (
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
      {memoizedPromptAgentTask}
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
      <Typography variant="h6">Exit Code Routing</Typography>
      <TaskEndCodeRoutingBuilder tasks={Object.values(item.tasks)} initialRouting={item.tasks_end_code_routing??{}} onChange={(newRouting) => onChange({ ...item, tasks_end_code_routing: newRouting })} isViewMode={!isEditMode}/>
      <Tooltip title="Normally, if a task being executed is present in the execution history of a task, it will be rejected, unless it is recursive. Workflows usually should have recursion enabled.">
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
      </Tooltip>
    </Box>
  );
};

export default Workflow;
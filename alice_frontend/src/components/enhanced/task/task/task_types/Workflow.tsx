import React, {useMemo} from 'react';
import { Box, TextField, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem, Chip, SelectChangeEvent } from '@mui/material';
import { TaskFormsProps, AliceTask } from '../../../../../utils/TaskTypes';
import EnhancedSelect from '../../../common/enhanced_select/EnhancedSelect';
import FunctionDefinitionBuilder from '../../../common/function_select/Function';
import { FunctionParameters } from '../../../../../utils/ParameterTypes';
import { ApiType } from '../../../../../utils/ApiTypes';
import EnhancedTask from '../../../task/task/EnhancedTask';
import { useApi } from '../../../../../context/ApiContext';

const Workflow: React.FC<TaskFormsProps> = ({
  item,
  onChange,
  mode,
  handleAccordionToggle,
  handleViewDetails,
  activeAccordion,
  apis
}) => {
  const { fetchItem } = useApi();
  const isEditMode = mode === 'edit' || mode === 'create';

  if (!item) {
    return <Box>No task data available.</Box>;
  }
  const availableApiTypes = useMemo(() => {
    if (!apis) return [];
    return Array.from(new Set(apis.map(api => api.api_type)));
  }, [apis]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ ...item, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onChange({ ...item, [name]: checked });
  };

  const handleTasksChange = async (selectedIds: string[]) => {
    const tasks = await Promise.all(selectedIds.map(id => fetchItem('tasks', id) as Promise<AliceTask>));
    const tasksObject = tasks.reduce((acc, task) => {
      acc[task.task_name] = task;
      return acc;
    }, {} as Record<string, AliceTask>);
    onChange({ ...item, tasks: tasksObject });
  };

  const handleStartTaskChange = async (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      const task = await fetchItem('tasks', selectedIds[0]) as AliceTask;
      onChange({ ...item, start_task: task.task_name });
    } else {
      onChange({ ...item, start_task: null });
    }
  };

  const handleInputVariablesChange = (functionDefinition: FunctionParameters) => {
    onChange({ ...item, input_variables: functionDefinition });
  };

  const handleRequiredApisChange = (event: SelectChangeEvent<ApiType[]>) => {
    const value = event.target.value as ApiType[];
    onChange({ ...item, required_apis: value });
  };

  return (
    <Box>
      <TextField
        fullWidth
        margin="normal"
        name="task_name"
        label="Workflow Name"
        value={item.task_name || ''}
        onChange={handleInputChange}
        required
        disabled={!isEditMode}
      />
      <TextField
        fullWidth
        margin="normal"
        name="task_description"
        label="Workflow Description"
        value={item.task_description || ''}
        onChange={handleInputChange}
        multiline
        rows={3}
        required
        disabled={!isEditMode}
      />

      <FunctionDefinitionBuilder
        initialParameters={item.input_variables || undefined}
        onChange={handleInputVariablesChange}
        isViewOnly={!isEditMode}
      />

      <EnhancedSelect<AliceTask>
        componentType="tasks"
        EnhancedComponent={EnhancedTask}
        selectedItems={Object.values(item.tasks || {})}
        onSelect={handleTasksChange}
        isInteractable={isEditMode}
        multiple
        label="Select Tasks"
        activeAccordion={activeAccordion}
        onAccordionToggle={handleAccordionToggle}
        onView={(id) => handleViewDetails("task", id)}
        accordionEntityName="tasks"
      />

      <EnhancedSelect<AliceTask>
        componentType="tasks"
        EnhancedComponent={EnhancedTask}
        selectedItems={item.start_task ? [item.tasks[item.start_task]] : []}
        onSelect={handleStartTaskChange}
        isInteractable={isEditMode}
        label="Select Start Task"
        activeAccordion={activeAccordion}
        onAccordionToggle={handleAccordionToggle}
        onView={(id) => handleViewDetails("task", id)}
        accordionEntityName="start-task"
      />


      <FormControl fullWidth margin="normal">
        <InputLabel>Required API Types</InputLabel>
        <Select
          multiple
          value={item.required_apis || []}
          onChange={handleRequiredApisChange}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as ApiType[]).map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
          disabled={!isEditMode}
        >
          {availableApiTypes.map((apiType) => (
            <MenuItem key={apiType} value={apiType}>
              {apiType}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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
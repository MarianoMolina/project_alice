import React, { useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import EnhancedSelect from '../../../common/enhanced_select/EnhancedSelect';
import EnhancedAgent from '../../../agent/agent/EnhancedAgent';
import EnhancedTask from '../../../task/task/EnhancedTask';
import { TaskFormsProps } from '../../../../../types/TaskTypes';
import { AliceAgent } from '../../../../../types/AgentTypes';
import { AliceTask } from '../../../../../types/TaskTypes';
import { ApiType } from '../../../../../types/ApiTypes';
import { FunctionParameters } from '../../../../../types/ParameterTypes';
import FunctionDefinitionBuilder from '../../../common/function_select/FunctionDefinitionBuilder';
import { useApi } from '../../../../../context/ApiContext';

const BasicAgentTask: React.FC<TaskFormsProps> = ({
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

  const availableApiTypes = useMemo(() => {
    if (!apis) return [];
    return Array.from(new Set(apis.map(api => api.api_type)));
  }, [apis]);

  const handleInputVariablesChange = useCallback((newDefinition: FunctionParameters) => {
    onChange({ ...item, input_variables: newDefinition });
  }, [onChange, item]);

  if (!item) {
    return <Box>No task data available.</Box>;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ ...item, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onChange({ ...item, [name]: checked });
  };

  const handleAgentChange = async (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      const agent = await fetchItem('agents', selectedIds[0]) as AliceAgent;
      onChange({ ...item, agent: agent });
    } else {
      onChange({ ...item, agent: null });
    }
  };

  const handleTasksChange = async (selectedIds: string[]) => {
    const tasks = await Promise.all(selectedIds.map(id => fetchItem('tasks', id) as Promise<AliceTask>));
    const tasksObject = tasks.reduce((acc, task) => {
      acc[task.task_name] = task;
      return acc;
    }, {} as Record<string, AliceTask>);
    onChange({ ...item, tasks: tasksObject });
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
        label="Task Name"
        value={item.task_name || ''}
        onChange={handleInputChange}
        required
        disabled={!isEditMode}
      />
      <TextField
        fullWidth
        margin="normal"
        name="task_description"
        label="Task Description"
        value={item.task_description || ''}
        onChange={handleInputChange}
        multiline
        rows={3}
        required
        disabled={!isEditMode}
      />

      <EnhancedSelect<AliceAgent>
        componentType="agents"
        EnhancedComponent={EnhancedAgent}
        selectedItems={item.agent ? [item.agent] : []}
        onSelect={handleAgentChange}
        isInteractable={isEditMode}
        label="Select Agent"
        activeAccordion={activeAccordion}
        onAccordionToggle={handleAccordionToggle}
        onView={(id) => handleViewDetails("agent", id)}
        accordionEntityName="agent"
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

      <FunctionDefinitionBuilder
        initialParameters={item.input_variables || undefined}
        onChange={handleInputVariablesChange}
        isViewOnly={!isEditMode}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={item.human_input || false}
            onChange={handleCheckboxChange}
            name="human_input"
            disabled={!isEditMode}
          />
        }
        label="Requires Human Input"
      />
    </Box>
  );
};

export default BasicAgentTask;
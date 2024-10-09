import React, { useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import AgentShortListView from '../../../agent/agent/AgentShortListView';
import TaskShortListView from '../../../task/task/TaskShortListView';
import { TaskFormsProps } from '../../../../../types/TaskTypes';
import { AliceAgent } from '../../../../../types/AgentTypes';
import { AliceTask } from '../../../../../types/TaskTypes';
import { ApiType } from '../../../../../types/ApiTypes';
import { FunctionParameters } from '../../../../../types/ParameterTypes';
import FunctionDefinitionBuilder from '../../../common/function_select/FunctionDefinitionBuilder';
import { useApi } from '../../../../../contexts/ApiContext';
import EnhancedSelect from '../../../common/enhanced_select/EnhancedSelect';
import { Prompt } from '../../../../../types/PromptTypes';
import PromptShortListView from '../../../prompt/prompt/PromptShortListView';

const PromptAgentTask: React.FC<TaskFormsProps> = ({
  item,
  onChange,
  mode,
  handleAccordionToggle,
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
    if (item && Object.keys(item).length !== 0) onChange({ ...item, input_variables: newDefinition });
  }, [item, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (item && Object.keys(item).length !== 0) {
      const { name, value } = e.target;
      onChange({ ...item, [name]: value });
    }
  }, [item, onChange]);

  const handleRequiredApisChange = useCallback((event: SelectChangeEvent<ApiType[]>) => {
    if (item && Object.keys(item).length !== 0) {
      const value = event.target.value as ApiType[];
      onChange({ ...item, required_apis: value });
    }
  }, [item, onChange]);
  
  const memoizedPromptSelect = useMemo(() => (
    <EnhancedSelect<Prompt>
      componentType="prompts"
      EnhancedView={PromptShortListView}
      selectedItems={item?.templates?.task_template ? [item.templates.task_template] : []}
      onSelect={async (selectedIds: string[]) => {
        if (item && Object.keys(item).length !== 0) {
          if (selectedIds.length > 0) {
            const prompt = await fetchItem('prompts', selectedIds[0]) as Prompt;
            onChange({
              ...item,
              templates: { ...item.templates, task_template: prompt },
            });
          } else {
            onChange({
              ...item,
              templates: { ...item.templates, task_template: null },
            });
          }
        }
      }}
      isInteractable={isEditMode}
      label="Select Task Template"
      activeAccordion={activeAccordion}
      onAccordionToggle={handleAccordionToggle}
      accordionEntityName="prompts"
      showCreateButton={true}
    />
  ), [item, isEditMode, activeAccordion, handleAccordionToggle, fetchItem, onChange]);

  const memoizedAgentSelect = useMemo(() => (
    <EnhancedSelect<AliceAgent>
      componentType="agents"
      EnhancedView={AgentShortListView}
      selectedItems={item?.agent ? [item.agent] : []}
      onSelect={async (selectedIds: string[]) => {
        if (item && Object.keys(item).length !== 0) {
          if (selectedIds.length > 0) {
            const agent = await fetchItem('agents', selectedIds[0]) as AliceAgent;
            onChange({ ...item, agent: agent });
          } else {
            onChange({ ...item, agent: null });
          }
        }
      }}
      isInteractable={isEditMode}
      label="Select Agent"
      activeAccordion={activeAccordion}
      onAccordionToggle={handleAccordionToggle}
      accordionEntityName="agent"
      showCreateButton={true}
    />
  ), [item, isEditMode, activeAccordion, handleAccordionToggle, fetchItem, onChange]);

  const memoizedTaskSelect = useMemo(() => (
    <EnhancedSelect<AliceTask>
      componentType="tasks"
      EnhancedView={TaskShortListView}
      selectedItems={Object.values(item?.tasks || {})}
      onSelect={async (selectedIds: string[]) => {
        if (item && Object.keys(item).length !== 0) {
          const tasks = await Promise.all(selectedIds.map(id => fetchItem('tasks', id) as Promise<AliceTask>));
          const tasksObject = tasks.reduce((acc, task) => {
            acc[task.task_name] = task;
            return acc;
          }, {} as Record<string, AliceTask>);
          onChange({ ...item, tasks: tasksObject });
        }
      }}
      isInteractable={isEditMode}
      multiple
      label="Select Tasks"
      activeAccordion={activeAccordion}
      onAccordionToggle={handleAccordionToggle}
      accordionEntityName="tasks"
      showCreateButton={true}
    />
  ), [item, isEditMode, activeAccordion, handleAccordionToggle, fetchItem, onChange]);

  if (!item || Object.keys(item).length === 0) {
    return <Box>No task data available.</Box>;
  }

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
      {memoizedAgentSelect}
      {memoizedTaskSelect}
      {memoizedPromptSelect}
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
    </Box>
  );
};

export default React.memo(PromptAgentTask);
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    FormControlLabel,
    Checkbox,
    Typography,
    Tooltip,
    SelectChangeEvent
} from '@mui/material';
import { AliceTask, getDefaultTaskForm, TaskComponentProps, TaskType } from '../../../../types/TaskTypes';
import { useApi } from '../../../../contexts/ApiContext';
import { FunctionParameters } from '../../../../types/ParameterTypes';
import { ApiType } from '../../../../types/ApiTypes';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import PromptShortListView from '../../prompt/prompt/PromptShortListView';
import { Prompt } from '../../../../types/PromptTypes';
import { AliceAgent } from '../../../../types/AgentTypes';
import AgentShortListView from '../../agent/agent/AgentShortListView';
import TaskShortListView from './TaskShortListView';
import TaskEndCodeRoutingBuilder from '../../common/task_end_code_routing/TaskEndCodeRoutingBuilder';
import FunctionDefinitionBuilder from '../../common/function_select/FunctionDefinitionBuilder';
import Logger from '../../../../utils/Logger';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';

const TaskFlexibleView: React.FC<TaskComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const { fetchItem } = useApi();
    const [taskType, setTaskType] = useState<TaskType>(item?.task_type || TaskType.PromptAgentTask);
    const [form, setForm] = useState<Partial<AliceTask>>(item || getDefaultTaskForm(taskType));
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    useEffect(() => {
        Logger.debug('useEffect TaskFlexibleView', { item, taskType });
        if (item && Object.keys(item).length !== 0) {
            setForm(item);
        } else if (!item || Object.keys(item).length === 0) {
            Logger.debug('TaskFlexibleView', 'getDefaultTaskForm', taskType);
            onChange(getDefaultTaskForm(taskType));
        }
    }, [item, onChange, taskType]);

    const isEditMode = mode === 'edit' || mode === 'create';

    const handleAccordionToggle = useCallback((accordion: string | null) => {
        setActiveAccordion(prevAccordion => prevAccordion === accordion ? null : accordion);
    }, []);

    const handleInputVariablesChange = useCallback((newDefinition: FunctionParameters) => {
        setForm(prevForm => ({ ...prevForm, input_variables: newDefinition }));
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
    }, []);

    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: checked }));
    }, []);

    const handleRequiredApisChange = useCallback((event: SelectChangeEvent<ApiType[]>) => {
        const value = event.target.value as ApiType[];
        setForm(prevForm => ({ ...prevForm, required_apis: value }));
    }, []);

    const handleTaskTypeChange = useCallback((event: SelectChangeEvent<TaskType>) => {
        const newType = event.target.value as TaskType;
        setTaskType(newType);
        setForm(getDefaultTaskForm(newType));
        Logger.debug('handleTaskTypeChange', newType);
    }, []);

    const handleValidLanguagesChange = useCallback((event: SelectChangeEvent<string[]>) => {
        const { target: { value } } = event;
        setForm(prevForm => ({ ...prevForm, valid_languages: typeof value === 'string' ? value.split(',') : value }));
    }, []);

    const handlePromptSelect = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const prompt = await fetchItem('prompts', selectedIds[0]) as Prompt;
            setForm(prevForm => ({ ...prevForm, templates: { ...form.templates, task_template: prompt } }));
        } else {
            setForm(prevForm => ({ ...prevForm, templates: { ...form.templates, task_template: null } }));
        }
    }, [fetchItem, form.templates]);

    const handleAgentSelect = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const agent = await fetchItem('agents', selectedIds[0]) as AliceAgent;
            setForm(prevForm => ({ ...prevForm, agent }));
        } else {
            setForm(prevForm => ({ ...prevForm, agent: null }));
        }
    }, [fetchItem]);

    const handleTaskSelect = useCallback(async (selectedIds: string[]) => {
        const tasks = await Promise.all(selectedIds.map(id => fetchItem('tasks', id) as Promise<AliceTask>));
        const tasksObject = tasks.reduce((acc, task) => {
            acc[task.task_name] = task;
            return acc;
        }, {} as Record<string, AliceTask>);
        setForm(prevForm => ({ ...prevForm, tasks: tasksObject }));
    }, [fetchItem]);

    const memoizedPromptSelect = useMemo(() => (
        <EnhancedSelect<Prompt>
            componentType="prompts"
            EnhancedView={PromptShortListView}
            selectedItems={form?.templates?.task_template ? [form.templates.task_template] : []}
            onSelect={handlePromptSelect}
            isInteractable={isEditMode}
            label="Select Task Template"
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="prompts"
            showCreateButton={true}
        />
    ), [form?.templates?.task_template, isEditMode, activeAccordion, handleAccordionToggle, handlePromptSelect]);

    const memoizedAgentSelect = useMemo(() => (
        <EnhancedSelect<AliceAgent>
            componentType="agents"
            EnhancedView={AgentShortListView}
            selectedItems={form?.agent ? [form.agent] : []}
            onSelect={handleAgentSelect}
            isInteractable={isEditMode}
            label="Select Agent"
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="agent"
            showCreateButton={true}
        />
    ), [form?.agent, isEditMode, activeAccordion, handleAccordionToggle, handleAgentSelect]);

    const memoizedTaskSelect = useMemo(() => (
        <EnhancedSelect<AliceTask>
            componentType="tasks"
            EnhancedView={TaskShortListView}
            selectedItems={Object.values(form?.tasks || {})}
            onSelect={handleTaskSelect}
            isInteractable={isEditMode}
            multiple
            label="Select Tasks"
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="tasks"
            showCreateButton={true}
        />
    ), [form?.tasks, isEditMode, activeAccordion, handleAccordionToggle, handleTaskSelect]);

    const handleLocalSave = useCallback(async () => {
        onChange(form);
        setIsSaving(true);
    }, [form, onChange]);

    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    if (!form || Object.keys(form).length === 0) {
        return <Box>No task data available.</Box>;
    }

    const title = mode === 'create' ? 'Create New Task' : mode === 'edit' ? 'Edit Task' : 'Task Details';
    const saveButtonText = form._id ? 'Update Task' : 'Create Task';

    return (
        <GenericFlexibleView
            elementType='Task'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as AliceTask}
            itemType='tasks'
        >
            <FormControl fullWidth margin="normal">
                <InputLabel>Task Type</InputLabel>
                <Select<TaskType>
                    value={taskType}
                    onChange={handleTaskTypeChange}
                    disabled={!isEditMode}
                >
                    {Object.values(TaskType).map((type) => (
                        <MenuItem key={type} value={type}>
                            {type.split(/(?=[A-Z])/).join(' ')}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField
                fullWidth
                margin="normal"
                name="task_name"
                label="Task Name"
                value={form.task_name || ''}
                onChange={handleInputChange}
                required
                disabled={!isEditMode}
            />
            <TextField
                fullWidth
                margin="normal"
                name="task_description"
                label="Task Description"
                value={form.task_description || ''}
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
                    value={form.required_apis || []}
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
                    {Object.values(ApiType).map((apiType) => (
                        <MenuItem key={apiType} value={apiType}>
                            {apiType}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FunctionDefinitionBuilder
                initialParameters={form.input_variables || undefined}
                onChange={handleInputVariablesChange}
                isViewOnly={!isEditMode}
            />

            {/* Workflow specific fields */}
            {taskType === 'Workflow' && (
                <>
                    <TextField
                        fullWidth
                        margin="normal"
                        name="max_attempts"
                        label="Max Attempts"
                        type="number"
                        value={form.max_attempts || ''}
                        onChange={handleInputChange}
                        inputProps={{ min: 1 }}
                        disabled={!isEditMode}
                    />
                    <Typography variant="h6">Exit Code Routing</Typography>
                    <TaskEndCodeRoutingBuilder
                        tasks={Object.values(form.tasks ?? {})}
                        initialRouting={form.tasks_end_code_routing || {}}
                        onChange={(newRouting) => onChange({ ...form, tasks_end_code_routing: newRouting })}
                        isViewMode={!isEditMode}
                    />
                    <Tooltip title="Normally, if a task being executed is present in the execution history of a task, it will be rejected, unless it is recursive. Workflows usually should have recursion enabled.">
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={form.recursive || false}
                                    onChange={handleCheckboxChange}
                                    name="recursive"
                                    disabled={!isEditMode}
                                />
                            }
                            label="Recursive"
                        />
                    </Tooltip>
                </>
            )}

            {/* CodeExecutionLLMTask specific fields */}
            {taskType === 'CodeExecutionLLMTask' && (
                <>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Valid Languages</InputLabel>
                        <Select
                            multiple
                            value={form.valid_languages || []}
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
                        value={form.timeout || ''}
                        onChange={handleInputChange}
                        inputProps={{ min: 1 }}
                        disabled={!isEditMode}
                    />
                </>
            )}

            {/* Add any other task-specific fields here */}
        </GenericFlexibleView>
    );
};

export default TaskFlexibleView;
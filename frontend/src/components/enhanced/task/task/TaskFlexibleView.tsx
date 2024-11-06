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
import { AliceTask, getDefaultTaskForm, TaskComponentProps, TasksEndCodeRouting, TaskType } from '../../../../types/TaskTypes';
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
import TaskFlowchart from '../../common/task_end_code_routing/FlowChart';
import useStyles from '../TaskStyles';
import ExitCodeManager from '../../common/exit_code_manager/ExitCodeManager';
import DataClusterManager from '../../data_cluster/data_cluster_manager/DataClusterManager';

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
    const classes = useStyles();

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    useEffect(() => {
        if (item && Object.keys(item).length !== 0) {
            Logger.debug('TaskFlexibleView', 'setForm', item);
            setForm(item);
        }
    }, [item]);

    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
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
        setForm(prevForm => ({ ...prevForm, task_type: newType }));
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

    const handleOutputPromptSelect = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const prompt = await fetchItem('prompts', selectedIds[0]) as Prompt;
            setForm(prevForm => ({ ...prevForm, templates: { ...prevForm.templates, output_prompt: prompt } }));
        } else {
            setForm(prevForm => ({ ...prevForm, templates: { ...prevForm.templates, output_prompt: null } }));
        }
    }, [fetchItem]);

    const handleAgentSelect = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const agent = await fetchItem('agents', selectedIds[0]) as AliceAgent;
            setForm(prevForm => ({ ...prevForm, agent }));
        } else {
            setForm(prevForm => ({ ...prevForm, agent: null }));
        }
    }, [fetchItem]);

    const handleTaskEndCodeRoutingChange = useCallback((newRouting: TasksEndCodeRouting) => {
        setForm(prevForm => ({ ...prevForm, node_end_code_routing: newRouting }));
    }, []);

    const handleTaskSelect = useCallback(async (selectedIds: string[]) => {
        const tasks = await Promise.all(selectedIds.map(id => fetchItem('tasks', id) as Promise<AliceTask>));
        const tasksObject = tasks.reduce((acc, task) => {
            acc[task.task_name] = task;
            return acc;
        }, {} as Record<string, AliceTask>);
        setForm(prevForm => ({ ...prevForm, tasks: tasksObject }));
    }, [fetchItem]);

    const handleExitCodesChange = useCallback((newExitCodes: { [key: string]: string }) => {
        setForm(prevForm => ({ ...prevForm, exit_codes: newExitCodes }));
    }, []);


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

    const memoizedOutputPromptSelect = useMemo(() => (
        <EnhancedSelect<Prompt>
            componentType="prompts"
            EnhancedView={PromptShortListView}
            selectedItems={form?.templates?.output_prompt ? [form.templates.output_prompt] : []}
            onSelect={handleOutputPromptSelect}
            isInteractable={isEditMode}
            label="Select Output Prompt"
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="output_prompt"
            showCreateButton={true}
        />
    ), [form?.templates?.output_prompt, isEditMode, activeAccordion, handleAccordionToggle, handleOutputPromptSelect]);

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
            <Typography variant="h6" className={classes.titleText}>Type</Typography>
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
            <Typography variant="h6" className={classes.titleText}>Name</Typography>
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
            <Typography variant="h6" className={classes.titleText}>Description</Typography>
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
            <Typography variant="h6" className={classes.titleText}>Agent</Typography>
            {memoizedAgentSelect}
            <Typography variant="h6" className={classes.titleText}>Sub-tasks</Typography>
            {memoizedTaskSelect}
            <Typography variant="h6" className={classes.titleText}>Template</Typography>
            {memoizedPromptSelect}
            {memoizedOutputPromptSelect}
            <Typography variant="h6" className={classes.titleText}>Required APIs</Typography>
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

            <Typography variant="h6" className={classes.titleText}>Input Variables</Typography>
            <FunctionDefinitionBuilder
                initialParameters={form.input_variables || undefined}
                onChange={handleInputVariablesChange}
                isViewOnly={!isEditMode}
            />
            <Typography variant="h6" className={classes.titleText}>Exit Codes</Typography>
            <ExitCodeManager
                exitCodes={form.exit_codes || {}}
                onChange={handleExitCodesChange}
                isEditMode={isEditMode}
            />
            {/* Workflow specific fields */}
            <Typography variant="h6" className={classes.titleText}>Node End Code Routing</Typography>
            <Box className={classes.endCodeRoutingContainer}>
                <TaskEndCodeRoutingBuilder
                    tasks={Object.values(form.tasks ?? {})}
                    routing={form.node_end_code_routing || {}}
                    onChange={handleTaskEndCodeRoutingChange}
                    isViewMode={!isEditMode}
                />
                <TaskFlowchart tasksEndCodeRouting={form.node_end_code_routing || {}} startTask={form.start_node || ''} />
            </Box>
            <Typography variant="h6" className={classes.titleText}>Max attempts</Typography>
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
            <Typography variant="h6" className={classes.titleText}>Enable Recursion</Typography>
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
            
            <Typography variant="h6" className={classes.titleText}>Data Cluster</Typography>
            <DataClusterManager
                dataCluster={form.data_cluster}
                isEditable={true}
                onDataClusterChange={(dataCluster) => setForm(prevForm => ({ ...prevForm, data_cluster: dataCluster }))}
                flatten={false}
            />

            {/* CodeExecutionLLMTask specific fields */}
            {taskType === 'CodeExecutionLLMTask' && (
                <>
                    <Typography variant="h6" className={classes.titleText}>Valid Languages for Execution</Typography>
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
                    <Typography variant="h6" className={classes.titleText}>Timeout</Typography>
                </>
            )}
        </GenericFlexibleView>
    );
};

export default TaskFlexibleView;
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, FormControl, InputLabel, MenuItem, Select, Typography, SelectChangeEvent, Button,
    List, ListItem, ListItemText, ListItemButton, ListItemIcon, IconButton, Tooltip, Card, CardContent,
    TextField, CircularProgress
} from '@mui/material';
import { Category, LibraryBooks, AddCircleOutline, Visibility, ChevronRight } from '@mui/icons-material';
import BaseDbElement, { BaseDbElementProps } from '../BaseDbElement';
import PromptAgentTask from './task/task_types/PromptAgentTask';
import CheckTask from './task/task_types/CheckTask';
import CodeGenerationLLMTask from './task/task_types/CodeGenerationLLMTask';
import CodeExecutionLLMTask from './task/task_types/CodeExecutionLLMTask';
import AgentWithFunctions from './task/task_types/AgentWithFunctions';
import Workflow from './task/task_types/Workflow';
import { AliceAgent } from '../../utils/AgentTypes';
import { Prompt } from '../../utils/PromptTypes';
import { AliceTask, TaskType, convertToAliceTask } from '../../utils/TaskTypes';
import useStyles from './TaskStyles';
import BasicAgentTask from './task/task_types/BasicAgentTask';
import { useApi } from '../../context/ApiContext';
import { useTask } from '../../context/TaskContext';
import FunctionDefinitionBuilder from '../parameter/Function';

type BaseTaskMode = BaseDbElementProps<AliceTask>['mode'];
type ExtendedTaskMode = 'list' | 'shortList' | 'card' | 'table' | 'detailed' | 'execute';
type EnhancedTaskMode = BaseTaskMode | ExtendedTaskMode;

interface EnhancedTaskProps {
    mode: EnhancedTaskMode;
    itemId?: string;
    isInteractable?: boolean;
    fetchAll: boolean;
    onInteraction?: (task: AliceTask) => void;
    onSave?: (task: AliceTask) => void;
    onAddTask?: (task: AliceTask) => void;
}

const taskTypes: TaskType[] = [
    "BasicAgentTask",
    "PromptAgentTask",
    "CheckTask",
    "CodeGenerationLLMTask",
    "CodeExecutionLLMTask",
    "AgentWithFunctions",
    "Workflow",
    "RedditSearchTask"
];

const EnhancedTask: React.FC<EnhancedTaskProps> = (props) => {
    const classes = useStyles();
    const [agents, setAgents] = useState<AliceAgent[]>([]);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [availableTasks, setAvailableTasks] = useState<AliceTask[]>([]);
    const { fetchItem } = useApi();
    const { setSelectedTask, handleExecuteTask, selectedResult } = useTask();

    const [inputValues, setInputValues] = useState<{ [key: string]: any }>({});
    const [executionStatus, setExecutionStatus] = useState<'idle' | 'progress' | 'success'>('idle');

    useEffect(() => {
        const fetchData = async () => {
            setAgents(await fetchItem('agents') as AliceAgent[]);
            setPrompts(await fetchItem('prompts') as Prompt[]);
            setAvailableTasks(await fetchItem('tasks') as AliceTask[]);
        };
        fetchData();
    }, [fetchItem]);

    const handleInputChange = (key: string, value: any) => {
        setInputValues(prevValues => ({ ...prevValues, [key]: value }));
    };

    const TaskForm: React.FC<{
        task: AliceTask | null;
        onChange: (newTask: Partial<AliceTask>) => void;
        mode: 'create' | 'view' | 'edit';
        handleSave: () => Promise<void>;
    }> = useCallback(({ task, onChange, mode, handleSave }) => {
        const isEditMode = mode === 'edit' || mode === 'create';
        const [taskType, setTaskType] = useState<TaskType>(task?.task_type || "BasicAgentTask");

        useEffect(() => {
            if (task) {
                setTaskType(task.task_type);
            }
        }, [task]);

        const handleTaskTypeChange = (event: SelectChangeEvent<TaskType>) => {
            const newType = event.target.value as TaskType;
            setTaskType(newType);
            onChange({ task_type: newType });
        };

        const renderTaskForm = () => {
            const commonProps = {
                agents: agents,
                prompts: prompts,
                availableTasks: availableTasks,
                viewOnly: !isEditMode,
            };

            const getTaskComponent = <T extends Partial<AliceTask>>(
                Component: React.ComponentType<{ form: T; setForm: (newForm: T) => void } & typeof commonProps>
            ) => {
                return (
                    <Component
                        form={task as T || {} as T}
                        setForm={(newForm: T) => onChange(newForm)}
                        {...commonProps}
                    />
                );
            };

            switch (taskType) {
                case 'BasicAgentTask':
                    return getTaskComponent(BasicAgentTask);
                case 'PromptAgentTask':
                    return getTaskComponent(PromptAgentTask);
                case 'CheckTask':
                    return getTaskComponent(CheckTask);
                case 'CodeGenerationLLMTask':
                    return getTaskComponent(CodeGenerationLLMTask);
                case 'CodeExecutionLLMTask':
                    return getTaskComponent(CodeExecutionLLMTask);
                case 'AgentWithFunctions':
                    return getTaskComponent(AgentWithFunctions);
                case 'Workflow':
                    return getTaskComponent(Workflow);
                default:
                    return getTaskComponent(BasicAgentTask);
            }
        };

        return (
            <Box>
                <FormControl fullWidth margin="normal" disabled={!isEditMode || !!task?._id}>
                    <InputLabel>Task Type</InputLabel>
                    <Select value={taskType} onChange={handleTaskTypeChange}>
                        {taskTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {renderTaskForm()}
                {isEditMode && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        sx={{ mt: 2 }}
                    >
                        {task?._id ? 'Update Task' : 'Create Task'}
                    </Button>
                )}
            </Box>
        );
    }, [agents, prompts, availableTasks]);

    const renderTask = useCallback((
        items: AliceTask[] | null,
        task: AliceTask | null,
        onChange: (newTask: Partial<AliceTask>) => void,
        mode: 'create' | 'view' | 'edit',
        handleSave: () => Promise<void>
    ) => {
        const alice_task = convertToAliceTask(task);
        return <TaskForm task={alice_task} onChange={onChange} mode={mode} handleSave={handleSave} />;
    }, [TaskForm]);

    const renderViewMode = (
        items: AliceTask[] | null,
        item: AliceTask | null,
        onChange: (newItem: Partial<AliceTask>) => void,
        mode: 'create' | 'view' | 'edit',
        handleSave: () => Promise<void>
    ) => {

        const executeTask = async (inputs: any) => {
            if (!item) return;
            setExecutionStatus('progress');
            setSelectedTask(item as AliceTask)
            setInputValues(inputs)
            await handleExecuteTask()
            return selectedResult
        };
        const renderSingleItem = (task: AliceTask) => {
            switch (props.mode) {
                case 'list':
                case 'shortList':
                    return (
                        <ListItem dense>
                            <ListItemText
                                primary={task.task_name}
                                secondary={props.mode === 'list' ? task.task_description : undefined}
                            />
                            <Tooltip title="View Task">
                                <IconButton edge="end" onClick={() => props.onInteraction && props.onInteraction(task)}>
                                    <Visibility />
                                </IconButton>
                            </Tooltip>
                            {props.onAddTask && (
                                <Tooltip title="Choose task to execute">
                                    <IconButton edge="end" onClick={() => props.onAddTask && props.onAddTask(task)}>
                                        <ChevronRight />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </ListItem>
                    );
                case 'table':
                    return <Typography>Table view not implemented yet</Typography>;
                case 'card':
                case 'detailed':
                    return (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" className={classes.title}>Active Task</Typography>
                                <Typography variant="subtitle1">{task.task_name}</Typography>
                                <Typography variant="body2">{task.task_description}</Typography>
                                <Typography variant="caption" className={classes.taskId}>
                                    Task ID: {task._id}
                                </Typography>
                                <List>
                                    <ListItemButton>
                                        <ListItemIcon><Category /></ListItemIcon>
                                        <ListItemText primary="Task Type" secondary={task.task_type} />
                                    </ListItemButton>
                                    <ListItemButton>
                                        <ListItemIcon><LibraryBooks /></ListItemIcon>
                                        <ListItemText
                                            primary="Templates"
                                            secondary={`${Object.keys(task.templates || {}).length} template(s)`}
                                        />
                                    </ListItemButton>
                                    <ListItemButton>
                                        <ListItemIcon><AddCircleOutline /></ListItemIcon>
                                        <ListItemText
                                            primary="Prompts to Add"
                                            secondary={`${Object.keys(task.prompts_to_add || {}).length} prompt(s)`}
                                        />
                                    </ListItemButton>
                                </List>

                                <Box>
                                    <Typography gutterBottom>Parameters</Typography>
                                    <FunctionDefinitionBuilder
                                        initialParameters={task.input_variables || undefined}
                                        isViewOnly={true}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    );
                case 'execute':
                    console.log('execute task', task, inputValues, executionStatus)
                    const inputVariables = task.input_variables?.properties;
                    console.log('inputVariables', inputVariables)
                    return (
                        <Card className={classes.taskCard}>
                            <CardContent>
                                <Typography variant="h6">{task.task_name}</Typography>
                                <Typography variant="body2">{task.task_description || ''}</Typography>
                                {inputVariables && Object.entries(inputVariables).map(([key, value]) => (
                                    <TextField
                                        key={key}
                                        label={key}
                                        value={inputValues[key] || ''}
                                        onChange={(e) => handleInputChange(key, e.target.value)}
                                        fullWidth
                                        className={classes.inputField}
                                        helperText={(value as any).description}
                                    />
                                ))}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => executeTask(inputVariables)}
                                    className={classes.executeButton}
                                    disabled={executionStatus === 'progress'}
                                >
                                    Execute Task
                                </Button>
                                <div className={classes.progressContainer}>
                                    {executionStatus === 'progress' && (
                                        <CircularProgress className={classes.progressIndicator} />
                                    )}
                                    {executionStatus === 'success' && (
                                        <Typography>Task executed successfully!</Typography>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                default:
                    return renderTask([task], task, onChange, 'view', handleSave);
            }
        };

        if (props.fetchAll && items) {
            return (
                <List>
                    {items.map((task) => (
                        <Box key={task._id}>
                            {renderSingleItem(convertToAliceTask(task))}
                        </Box>
                    ))}
                </List>
            );
        } else if (item) {
            return renderSingleItem(convertToAliceTask(item));
        } else {
            return <Typography>No task data available.</Typography>;
        }
    };

    const baseDbMode: BaseDbElementProps<AliceTask>['mode'] =
        props.mode === 'create' ? 'create' :
            props.mode === 'edit' ? 'edit' : 'view';

    return (
        <BaseDbElement<AliceTask>
            collectionName="tasks"
            itemId={props.itemId}
            mode={baseDbMode}
            isInteractable={props.isInteractable}
            onInteraction={props.onInteraction}
            onSave={props.onSave}
            fetchAll={props.fetchAll}
            render={['list', 'shortList', 'card', 'table', 'detailed', 'execute'].includes(props.mode)
                ? renderViewMode
                : renderTask}
        />
    );
};

export default EnhancedTask;
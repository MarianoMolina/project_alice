import React, { useState }  from 'react';
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button
} from '@mui/material';
import { AliceTask, TaskComponentProps, TaskType, PromptAgentTaskForm, CheckTaskForm, CodeExecutionLLMTaskForm, CodeGenerationLLMTaskForm, WorkflowForm, AgentWithFunctionsForm, AnyTaskForm } from '../../../utils/TaskTypes';
import { SelectChangeEvent } from '@mui/material';
import { useConfig } from '../../../context/ConfigContext';
import BasicAgentTask from './task_types/BasicAgentTask';
import PromptAgentTask from './task_types/PromptAgentTask';
import CheckTask from './task_types/CheckTask';
import CodeGenerationLLMTask from './task_types/CodeGenerationLLMTask';
import CodeExecutionLLMTask from './task_types/CodeExecutionLLMTask';
import AgentWithFunctions from './task_types/AgentWithFunctions';
import Workflow from './task_types/Workflow';
import { BaseTaskForm } from '../../../utils/TaskTypes';

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

const TaskFlexibleView: React.FC<TaskComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {
    const isEditMode = mode === 'edit' || mode === 'create';
    const [taskType, setTaskType] = useState<TaskType>(item?.task_type || "BasicAgentTask");

    const {
        agents,
        prompts,
        tasks,
    } = useConfig();
    
    if (!item) {
        return <Typography>No task data available.</Typography>;
    }   


    const handleTaskTypeChange = (event: SelectChangeEvent<TaskType>) => {
        const newType = event.target.value as TaskType;
        setTaskType(newType);
        onChange({ task_type: newType });
    };

    function assertTaskForm<T extends AnyTaskForm>(item: Partial<AliceTask>, taskType: TaskType): T {
        const baseForm: BaseTaskForm = {
            task_name: item.task_name || '',
            task_description: item.task_description || '',
            task_type: taskType,
            agent: item.agent || null,
            human_input: item.human_input || false,
            input_variables: item.input_variables || null,
            templates: item.templates || {},
            prompts_to_add: item.prompts_to_add || null,
        };

        switch(taskType) {
            case 'PromptAgentTask':
            case 'BasicAgentTask':
                return baseForm as T;
            case 'CheckTask':
                return { ...baseForm, exit_code_response_map: item.exit_code_response_map || null } as T;
            case 'CodeGenerationLLMTask':
            case 'CodeExecutionLLMTask':
                return { ...baseForm, exit_codes: item.exit_codes || {}, valid_languages: item.valid_languages || [], timeout: item.timeout || null } as T;
            case 'AgentWithFunctions':
                return { ...baseForm, tasks: item.tasks || {}, execution_agent: item.execution_agent || null } as T;
            case 'Workflow':
                return { ...baseForm, tasks: item.tasks || {}, start_task: item.start_task || null, max_attempts: item.max_attempts || 1, recursive: item.recursive || false } as T;
            default:
                return baseForm as T;
        }
    }

    const renderTaskForm = () => {
        const commonProps = {
            agents: agents,
            prompts: prompts,
            availableTasks: tasks,
            viewOnly: !isEditMode,
        };

        const getTaskComponent = <T extends AnyTaskForm>(
            Component: React.ComponentType<{ form: T; setForm: (newForm: T) => void } & typeof commonProps>
        ) => {
            return (
                <Component
                    form={assertTaskForm<T>(item, taskType)}
                    setForm={(newForm: T) => onChange(newForm)}
                    {...commonProps}
                />
            );
        };

        switch (taskType) {
            case 'BasicAgentTask':
                return getTaskComponent<PromptAgentTaskForm>(BasicAgentTask);
            case 'PromptAgentTask':
                return getTaskComponent<PromptAgentTaskForm>(PromptAgentTask);
            case 'CheckTask':
                return getTaskComponent<CheckTaskForm>(CheckTask);
            case 'CodeGenerationLLMTask':
                return getTaskComponent<CodeGenerationLLMTaskForm>(CodeGenerationLLMTask);
            case 'CodeExecutionLLMTask':
                return getTaskComponent<CodeExecutionLLMTaskForm>(CodeExecutionLLMTask);
            case 'AgentWithFunctions':
                return getTaskComponent<AgentWithFunctionsForm>(AgentWithFunctions);
            case 'Workflow':
                return getTaskComponent<WorkflowForm>(Workflow);
            default:
                return getTaskComponent<PromptAgentTaskForm>(BasicAgentTask);
        }
    };

    return (
        <Box>
            <FormControl fullWidth margin="normal" disabled={!isEditMode || !!item?._id}>
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
                    {item?._id ? 'Update Task' : 'Create Task'}
                </Button>
            )}
        </Box>
    );
};

export default TaskFlexibleView;
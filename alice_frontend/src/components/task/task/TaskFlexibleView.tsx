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
import { AliceTask, TaskComponentProps } from '../../../utils/TaskTypes';
import { TaskType } from '../../../utils/TaskTypes';
import { SelectChangeEvent } from '@mui/material';
import { useConfig } from '../../../context/ConfigContext';
import BasicAgentTask from './task_types/BasicAgentTask';
import PromptAgentTask from './task_types/PromptAgentTask';
import CheckTask from './task_types/CheckTask';
import CodeGenerationLLMTask from './task_types/CodeGenerationLLMTask';
import CodeExecutionLLMTask from './task_types/CodeExecutionLLMTask';
import AgentWithFunctions from './task_types/AgentWithFunctions';
import Workflow from './task_types/Workflow';

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

    if (!item) {
        return <Typography>No task data available.</Typography>;
    }   

    const {
        agents,
        prompts,
        tasks,
    } = useConfig();

    const handleTaskTypeChange = (event: SelectChangeEvent<TaskType>) => {
        const newType = event.target.value as TaskType;
        setTaskType(newType);
        onChange({ task_type: newType });
    };

    const renderTaskForm = () => {
        const commonProps = {
            agents: agents,
            prompts: prompts,
            availableTasks: tasks,
            viewOnly: !isEditMode,
        };

        const getTaskComponent = <T extends Partial<AliceTask>>(
            Component: React.ComponentType<{ form: T; setForm: (newForm: T) => void } & typeof commonProps>
        ) => {
            return (
                <Component
                    form={item as T || {} as T}
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
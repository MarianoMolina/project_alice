import EnhancedAgent from '../../agent/agent/EnhancedAgent';
import EnhancedPrompt from '../../prompt/prompt/EnhancedPrompt';
import EnhancedTask from '../../task/task/EnhancedTask';
import EnhancedAPI from '../../api/api/EnhancedApi';
import React, { useState, useEffect } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
} from '@mui/material';
import { AliceTask, TaskComponentProps, TaskType, getDefaultTaskForm } from '../../../../types/TaskTypes';
import { SelectChangeEvent } from '@mui/material';
import BasicAgentTask from './task_types/BasicAgentTask';
import PromptAgentTask from './task_types/PromptAgentTask';
import CheckTask from './task_types/CheckTask';
import CodeGenerationLLMTask from './task_types/CodeGenerationLLMTask';
import CodeExecutionLLMTask from './task_types/CodeExecutionLLMTask';
import Workflow from './task_types/Workflow';
import ApiTask from './task_types/ApiTask';
import { API } from '../../../../types/ApiTypes';
import { useApi } from '../../../../context/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';

const taskTypes: TaskType[] = [
    "BasicAgentTask",
    "PromptAgentTask",
    "CheckTask",
    "CodeGenerationLLMTask",
    "CodeExecutionLLMTask",
    "Workflow",
    "APITask"
];

const TaskFlexibleView: React.FC<TaskComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {
    const { fetchItem } = useApi();
    const isEditMode = mode === 'edit' || mode === 'create';
    const [taskType, setTaskType] = useState<TaskType>(item?.task_type || "BasicAgentTask");
    const [form, setForm] = useState<AliceTask>(getDefaultTaskForm(taskType));
    const [apis, setApis] = useState<API[]>([]);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        if (item) {
            setForm({ ...getDefaultTaskForm(item.task_type), ...item });
        }
    }, [item]);

    useEffect(() => {
        fetchItem('apis').then((data) => setApis(data as API[]));
    }, [fetchItem]);

    const handleTaskTypeChange = (event: SelectChangeEvent<TaskType>) => {
        const newType = event.target.value as TaskType;
        setTaskType(newType);
        const newForm = getDefaultTaskForm(newType);
        onChange(newForm);
    };

    const handleFormChange = (newFormData: Partial<AliceTask>) => {
        onChange(newFormData);
    };

    const handleAccordionToggle = (accordion: string | null) => {
        setActiveAccordion(prevAccordion => prevAccordion === accordion ? null : accordion);
    };

    const handleViewDetails = (type: 'agent' | 'task' | 'api' | 'template' | 'prompt', itemId: string) => {
        let content;
        switch (type) {
            case 'agent':
                content = <EnhancedAgent mode="card" itemId={itemId} fetchAll={false} />;
                break;
            case 'task':
                content = <EnhancedTask mode="card" itemId={itemId} fetchAll={false} />;
                break;
            case 'api':
                content = <EnhancedAPI mode="card" itemId={itemId} fetchAll={false} />;
                break;
            case 'template':
            case 'prompt':
                content = <EnhancedPrompt mode="card" itemId={itemId} fetchAll={false} />;
                break;
        }
        setDialogContent(content);
        setDialogOpen(true);
    };

    const renderTaskForm = () => {
        const commonProps = {
            items: null,
            item: form,
            onChange: handleFormChange,
            mode,
            handleSave,
            handleAccordionToggle,
            handleViewDetails,
            activeAccordion,
            apis
        };

        switch (taskType) {
            case 'BasicAgentTask':
                return <BasicAgentTask {...commonProps} />;
            case 'PromptAgentTask':
                return <PromptAgentTask {...commonProps} />;
            case 'CheckTask':
                return <CheckTask {...commonProps} />;
            case 'CodeGenerationLLMTask':
                return <CodeGenerationLLMTask {...commonProps} />;
            case 'CodeExecutionLLMTask':
                return <CodeExecutionLLMTask {...commonProps} />;
            case 'Workflow':
                return <Workflow {...commonProps} />;
            case 'APITask':
                return <ApiTask {...commonProps} />;
            default:
                return null;
        }
    };

    const title = mode === 'create' ? 'Create New Task' : mode === 'edit' ? 'Edit Task' : 'Task Details';
    const saveButtonText = form._id ? 'Update Task' : 'Create Task';

    return (
        <GenericFlexibleView
            elementType='Task'
            title={title}
            onSave={handleSave}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
        >
            <FormControl fullWidth margin="normal" disabled={!isEditMode}>
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
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                {dialogContent}
            </Dialog>
        </GenericFlexibleView>
    );
};

export default TaskFlexibleView;
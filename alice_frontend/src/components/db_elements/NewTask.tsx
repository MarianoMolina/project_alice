import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography, SelectChangeEvent, Button } from '@mui/material';
import BasicAgentTask from './task_types/BasicAgentTask';
import PromptAgentTask from './task_types/PromptAgentTask';
import CheckTask from './task_types/CheckTask';
import CodeGenerationLLMTask from './task_types/CodeGenerationLLMTask';
import CodeExecutionLLMTask from './task_types/CodeExecutionLLMTask';
import AgentWithFunctions from './task_types/AgentWithFunctions';
import Workflow from './task_types/Workflow';
import { fetchItem, updateItem, createItem } from '../../services/api';
import { AliceAgent, Prompt, AliceTask, PromptAgentTaskForm, CheckTaskForm, CodeGenerationLLMTaskForm, CodeExecutionLLMTaskForm, AgentWithFunctionsForm, WorkflowForm, TaskType } from '../../utils/types';
import { useTask } from '../../context/TaskContext';

const taskTypes = [
  'BasicAgentTask',
  'PromptAgentTask',
  'CheckTask',
  'CodeGenerationLLMTask',
  'CodeExecutionLLMTask',
  'AgentWithFunctions',
  'Workflow',
];

interface NewTaskProps {
  taskId?: string;
  viewOnly?: boolean;
  onTaskCreated?: (task: AliceTask) => void;
}

const NewTask: React.FC<NewTaskProps> = ({ taskId, viewOnly = false, onTaskCreated }) => {
  const { createNewTask, updateTask } = useTask();
  const [selectedTaskType, setSelectedTaskType] = useState<string>('');
  const [agents, setAgents] = useState<AliceAgent[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [availableTasks, setAvailableTasks] = useState<AliceTask[]>([]);
  const [taskForm, setTaskForm] = useState<PromptAgentTaskForm | CheckTaskForm | CodeGenerationLLMTaskForm | CodeExecutionLLMTaskForm | AgentWithFunctionsForm | WorkflowForm>({
    task_name: '',
    task_description: '',
    agent_id: '',
    human_input: false,
    input_variables: '',
    templates: { task_template: '' },
    prompts_to_add: {},
  });
  const [originalTaskForm, setOriginalTaskForm] = useState<typeof taskForm | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchAgents();
    fetchPrompts();
    fetchTasks();
    if (taskId) {
      fetchTask(taskId);
    }
  }, [taskId]);

  useEffect(() => {
    if (originalTaskForm) {
      setHasChanges(JSON.stringify(taskForm) !== JSON.stringify(originalTaskForm));
    }
  }, [taskForm, originalTaskForm]);

  const fetchAgents = async () => {
    try {
      const fetchedAgents = await fetchItem('agents');
      setAgents(fetchedAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchPrompts = async () => {
    try {
      const fetchedPrompts = await fetchItem('prompts');
      setPrompts(fetchedPrompts);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const fetchedTasks = await fetchItem('tasks');
      setAvailableTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchTask = async (id: string) => {
    try {
      const task = await fetchItem('tasks', id);
      setTaskForm(task);
      setOriginalTaskForm(task);
      setSelectedTaskType(task.task_type);
    } catch (error) {
      console.error('Error fetching task:', error);
    }
  };

  const handleTaskTypeChange = (event: SelectChangeEvent<string>) => {
    if (!taskId) {
      setSelectedTaskType(event.target.value as string);
      // Reset the form when changing task type
      setTaskForm({
        task_name: '',
        task_description: '',
        agent_id: '',
        human_input: false,
        input_variables: '',
        templates: { task_template: '' },
        prompts_to_add: {},
      });
    }
  };

  const castToAliceTask = (form: any, selectedTaskType: string): Partial<AliceTask> => {
    if (!isValidTaskType(selectedTaskType)) {
      throw new Error(`Invalid task type: ${selectedTaskType}`);
    }
    const baseTask: Partial<AliceTask> = {
      task_name: form.task_name,
      task_description: form.task_description,
      task_type: selectedTaskType,
      input_variables: form.input_variables ? JSON.parse(form.input_variables) : null,
      templates: new Map(Object.entries(form.templates)),
      prompts_to_add: form.prompts_to_add ? new Map(Object.entries(form.prompts_to_add)) : null,
      agent_id: form.agent_id,
      human_input: form.human_input,
    };

    switch (selectedTaskType) {
      case 'AgentWithFunctions':
        return {
          ...baseTask,
          tasks: [new Map(Object.entries(form.tasks))],
          execution_agent_id: form.execution_agent_id,
        };
      case 'CheckTask':
        return {
          ...baseTask,
          exit_code_response_map: new Map(Object.entries(form.exit_code_response_map)),
        };
      case 'CodeExecutionLLMTask':
        return {
          ...baseTask,
          exit_codes: new Map(Object.entries(form.exit_codes)),
          valid_languages: form.valid_languages,
          timeout: form.timeout,
        };
      case 'CodeGenerationLLMTask':
        return {
          ...baseTask,
          exit_codes: new Map(Object.entries(form.exit_codes)),
        };
      case 'Workflow':
        return {
          ...baseTask,
          tasks: [new Map(Object.entries(form.tasks))],
          start_task: form.start_task,
          max_attempts: form.max_attempts,
          recursive: form.recursive,
        };
      default:
        return baseTask;
    }
  };
  const isValidTaskType = (type: string): type is TaskType => {
    const validTaskTypes: TaskType[] = [
      "CVGenerationTask",
      "RedditSearchTask",
      "APITask",
      "WikipediaSearchTask",
      "GoogleSearchTask",
      "ExaSearchTask",
      "ArxivSearchTask",
      "BasicAgentTask",
      "PromptAgentTask",
      "CheckTask",
      "CodeGenerationLLMTask",
      "CodeExecutionLLMTask",
      "AgentWithFunctions",
    ];
    return validTaskTypes.includes(type as TaskType);
  };

  const handleSave = async () => {
    try {
      const taskData = castToAliceTask(taskForm, selectedTaskType);
      if (taskId) {
        const savedTask = await updateTask(taskId, taskData);
        if (savedTask && onTaskCreated) onTaskCreated(savedTask as AliceTask)
      } else {
        const savedTask = await createNewTask(taskData);
        if (savedTask && onTaskCreated) onTaskCreated(savedTask as AliceTask)
      }
  
      setHasChanges(false);
  
      if (taskId) {
        setOriginalTaskForm(taskForm);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
    };
  };

  const renderTaskForm = () => {
    const commonProps = {
      agents: agents,
      prompts: prompts,
      availableTasks: availableTasks,
      viewOnly: viewOnly,
    };

    switch (selectedTaskType) {
      case 'BasicAgentTask':

      case 'PromptAgentTask':
        return <PromptAgentTask form={taskForm as PromptAgentTaskForm} setForm={setTaskForm as React.Dispatch<React.SetStateAction<PromptAgentTaskForm>>} {...commonProps} />;
      case 'CheckTask':
        return <CheckTask form={taskForm as CheckTaskForm} setForm={setTaskForm as React.Dispatch<React.SetStateAction<CheckTaskForm>>} {...commonProps} />;
      case 'CodeGenerationLLMTask':
        return <CodeGenerationLLMTask form={taskForm as CodeGenerationLLMTaskForm} setForm={setTaskForm as React.Dispatch<React.SetStateAction<CodeGenerationLLMTaskForm>>} {...commonProps} />;
      case 'CodeExecutionLLMTask':
        return <CodeExecutionLLMTask form={taskForm as CodeExecutionLLMTaskForm} setForm={setTaskForm as React.Dispatch<React.SetStateAction<CodeExecutionLLMTaskForm>>} {...commonProps} />;
      case 'AgentWithFunctions':
        return <AgentWithFunctions form={taskForm as AgentWithFunctionsForm} setForm={setTaskForm as React.Dispatch<React.SetStateAction<AgentWithFunctionsForm>>} {...commonProps} />;
      case 'Workflow':
        return <Workflow form={taskForm as WorkflowForm} setForm={setTaskForm as React.Dispatch<React.SetStateAction<WorkflowForm>>} availableTasks={availableTasks} viewOnly={viewOnly} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <FormControl fullWidth margin="normal" disabled={viewOnly || !!taskId}>
        <InputLabel>Task Type</InputLabel>
        <Select value={selectedTaskType} onChange={handleTaskTypeChange}>
          {taskTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {renderTaskForm()}
      {!viewOnly && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={!hasChanges}
          sx={{ mt: 2 }}
        >
          {taskId ? 'Update Task' : 'Create Task'}
        </Button>
      )}
    </Box>
  );
};

export default NewTask;
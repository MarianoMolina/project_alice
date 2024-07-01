import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
} from '@mui/material';
import { Delete, Add, Edit } from '@mui/icons-material';
import { fetchItem, createItem, updateItem } from '../../services/api';
import { AliceTask, FunctionParameters, Prompt, AliceAgent } from '../../utils/types';
import PromptComponent from './PromptComponent';
import AgentComponent from './Agent';
import useStyles from '../../styles/TaskStyles';
import { useTask } from '../../context/TaskContext';

interface TaskProps {
  taskId?: string;
  onClose: () => void;
  viewOnly?: boolean
}

const taskTypes = [
  "CVGenerationTask", "RedditSearchTask", "APITask", "WikipediaSearchTask", 
  "GoogleSearchTask", "ExaSearchTask", "ArxivSearchTask", "BasicAgentTask", 
  "PromptAgentTask", "CheckTask", "CodeGenerationLLMTask", "CodeExecutionLLMTask", 
  "AgentWithFunctions"
];

const Task: React.FC<TaskProps> = ({ taskId, onClose, viewOnly }) => {
  const classes = useStyles();
  const [task, setTask] = useState<Partial<AliceTask>>({});
  const [newExitCode, setNewExitCode] = useState<{ code: string; message: string }>({ code: '', message: '' });
  const [newLanguage, setNewLanguage] = useState('');
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [selectedPromptType, setSelectedPromptType] = useState<'template' | 'prompt_to_add' | null>(null);
  const viewOnlyMode = viewOnly || false;
  const {
    createNewTask,
  } = useTask();
  const isNewTask = !taskId;

  useEffect(() => {
    const fetchData = async () => {
      if (taskId) {
        const taskData = await fetchItem('tasks', taskId);
        setTask(taskData);
      }
    };
    fetchData();
  }, [taskId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setTask((prev) => ({ ...prev, [name]: checked }));
  };

  // const handleExitCodeAdd = () => {
  //   setTask((prev) => ({
  //     ...prev,
  //     exit_codes: { ...prev.exit_codes, [newExitCode.code]: newExitCode.message }
  //   }));
  //   setNewExitCode({ code: '', message: '' });
  // };

  // const handleExitCodeDelete = (code: string) => {
  //   setTask((prev) => {
  //     const newExitCodes = { ...prev.exit_codes };
  //     delete newExitCodes[code];
  //     return { ...prev, exit_codes: newExitCodes };
  //   });
  // };

  const handleLanguageAdd = () => {
    setTask((prev) => ({
      ...prev,
      valid_languages: [...(prev.valid_languages || []), newLanguage]
    }));
    setNewLanguage('');
  };

  const handleLanguageDelete = (language: string) => {
    setTask((prev) => ({
      ...prev,
      valid_languages: prev.valid_languages?.filter((lang) => lang !== language) || []
    }));
  };

  const handlePromptAdd = (promptId: string, type: 'template' | 'prompt_to_add') => {
    setTask((prev) => ({
      ...prev,
      [type === 'template' ? 'templates' : 'prompts_to_add']: {
        ...(prev[type === 'template' ? 'templates' : 'prompts_to_add'] || {}),
        [promptId]: promptId
      }
    }));
  };

  // const handlePromptDelete = (promptId: string, type: 'template' | 'prompt_to_add') => {
  //   setTask((prev) => {
  //     const newPrompts = { ...(prev[type === 'template' ? 'templates' : 'prompts_to_add'] || {}) };
  //     delete newPrompts[promptId];
  //     return { ...prev, [type === 'template' ? 'templates' : 'prompts_to_add']: newPrompts };
  //   });
  // };

  const handleAgentChange = (agentId: string, type: 'agent_id' | 'execution_agent_id') => {
    setTask((prev) => ({ ...prev, [type]: agentId }));
  };

  const handleSave = async () => {
    try {
      await createNewTask(task);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  return (
    <Box className={classes.root}>
      <Typography variant="h6" gutterBottom>
        {isNewTask ? 'Create New Task' : 'Edit Task'}
      </Typography>
      <TextField
        fullWidth
        label="Task Name"
        name="task_name"
        value={task.task_name || ''}
        onChange={handleChange}
        className={classes.formControl}
      />
      <TextField
        fullWidth
        label="Task Description"
        name="task_description"
        value={task.task_description || ''}
        onChange={handleChange}
        className={classes.formControl}
        multiline
        rows={3}
      />
      {/* <FormControl fullWidth className={classes.formControl}>
        <InputLabel>Task Type</InputLabel>
        <Select
          name="task_type"
          value={task.task_type || ''}
          onChange={handleChange}
        >
          {taskTypes.map((type) => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </Select>
      </FormControl> */}
      <TextField
        fullWidth
        label="Input Variables (JSON)"
        name="input_variables"
        value={JSON.stringify(task.input_variables) || ''}
        onChange={(e) => setTask((prev) => ({ ...prev, input_variables: JSON.parse(e.target.value) }))}
        className={classes.formControl}
        multiline
        rows={3}
      />
      <Typography variant="subtitle1" gutterBottom>Exit Codes</Typography>
      {/* <List>
        {Object.entries(task.exit_codes || {}).map(([code, message]) => (
          <ListItem key={code} className={classes.listItem}>
            <ListItemText primary={`${code}: ${message}`} />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => handleExitCodeDelete(code)}>
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Box display="flex" alignItems="center">
        <TextField
          label="Code"
          value={newExitCode.code}
          onChange={(e) => setNewExitCode({ ...newExitCode, code: e.target.value })}
          className={classes.formControl}
        />
        <TextField
          label="Message"
          value={newExitCode.message}
          onChange={(e) => setNewExitCode({ ...newExitCode, message: e.target.value })}
          className={classes.formControl}
        />
        <Button onClick={handleExitCodeAdd}>Add</Button>
      </Box> */}
      <FormControlLabel
        control={
          <Checkbox
            checked={task.recursive || false}
            onChange={handleCheckboxChange}
            name="recursive"
          />
        }
        label="Recursive"
      />
      <Typography variant="subtitle1" gutterBottom>Templates</Typography>
      {/* <List>
        {Object.entries(task.templates || {}).map(([name, promptId]) => (
          <ListItem key={name} className={classes.listItem}>
            <ListItemText primary={name} />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => handlePromptDelete(promptId as string, 'template')}>
                <Delete />
              </IconButton>
              <IconButton edge="end" onClick={() => {
                setSelectedPromptType('template');
                setPromptDialogOpen(true);
              }}>
                <Edit />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List> */}
      <Button onClick={() => {
        setSelectedPromptType('template');
        setPromptDialogOpen(true);
      }} className={classes.addButton}>
        Add Template
      </Button>
      <Typography variant="subtitle1" gutterBottom>Valid Languages</Typography>
      <Box className={classes.chipContainer}>
        {task.valid_languages?.map((language) => (
          <Chip
            key={language}
            label={language}
            onDelete={() => handleLanguageDelete(language)}
          />
        ))}
      </Box>
      <Box display="flex" alignItems="center">
        <TextField
          label="New Language"
          value={newLanguage}
          onChange={(e) => setNewLanguage(e.target.value)}
          className={classes.formControl}
        />
        <Button onClick={handleLanguageAdd}>Add</Button>
      </Box>
      <TextField
        fullWidth
        label="Timeout"
        name="timeout"
        type="number"
        value={task.timeout || ''}
        onChange={handleChange}
        className={classes.formControl}
      />
      <Typography variant="subtitle1" gutterBottom>Prompts to Add</Typography>
      {/* <List>
        {Object.entries(task.prompts_to_add || {}).map(([name, promptId]) => (
          <ListItem key={name} className={classes.listItem}>
            <ListItemText primary={name} />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => handlePromptDelete(promptId as string, 'prompt_to_add')}>
                <Delete />
              </IconButton>
              <IconButton edge="end" onClick={() => {
                setSelectedPromptType('prompt_to_add');
                setPromptDialogOpen(true);
              }}>
                <Edit />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List> */}
      <Button onClick={() => {
        setSelectedPromptType('prompt_to_add');
        setPromptDialogOpen(true);
      }} className={classes.addButton}>
        Add Prompt
      </Button>
      <TextField
        fullWidth
        label="Exit Code Response Map (JSON)"
        name="exit_code_response_map"
        value={JSON.stringify(task.exit_code_response_map) || ''}
        onChange={(e) => setTask((prev) => ({ ...prev, exit_code_response_map: JSON.parse(e.target.value) }))}
        className={classes.formControl}
        multiline
        rows={3}
      />
      <TextField
        fullWidth
        label="Start Task"
        name="start_task"
        value={task.start_task || ''}
        onChange={handleChange}
        className={classes.formControl}
      />
      <TextField
        fullWidth
        label="Tasks End Code Routing (JSON)"
        name="tasks_end_code_routing"
        value={JSON.stringify(task.tasks_end_code_routing) || ''}
        onChange={(e) => setTask((prev) => ({ ...prev, tasks_end_code_routing: JSON.parse(e.target.value) }))}
        className={classes.formControl}
        multiline
        rows={3}
      />
      <TextField
        fullWidth
        label="Max Attempts"
        name="max_attempts"
        type="number"
        value={task.max_attempts || ''}
        onChange={handleChange}
        className={classes.formControl}
      />
      <Button onClick={() => setAgentDialogOpen(true)} className={classes.addButton}>
        {task.agent_id ? 'Change Agent' : 'Add Agent'}
      </Button>
      <Button onClick={() => setAgentDialogOpen(true)} className={classes.addButton}>
        {task.execution_agent_id ? 'Change Execution Agent' : 'Add Execution Agent'}
      </Button>
      <FormControlLabel
        control={
          <Checkbox
            checked={task.human_input || false}
            onChange={handleCheckboxChange}
            name="human_input"
          />
        }
        label="Human Input"
      />
      <Box className={classes.buttonContainer}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          {isNewTask ? 'Create Task' : 'Update Task'}
        </Button>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      </Box>

      {/* <Dialog open={promptDialogOpen} onClose={() => setPromptDialogOpen(false)} maxWidth="md" fullWidth>
        <PromptComponent
          onClose={() => setPromptDialogOpen(false)}
          onSave={(promptId: string) => {
            handlePromptAdd(promptId, selectedPromptType!);
            setPromptDialogOpen(false);
          }}
        />
      </Dialog>

      <Dialog open={agentDialogOpen} onClose={() => setAgentDialogOpen(false)} maxWidth="md" fullWidth>
        <AgentComponent
          onClose={() => setAgentDialogOpen(false)}
          onSave={(agentId: string) => {
            handleAgentChange(agentId, 'agent_id');
            setAgentDialogOpen(false);
          }}
        />
      </Dialog>
      <Dialog open={agentDialogOpen} onClose={() => setAgentDialogOpen(false)} maxWidth="md" fullWidth>
        <AgentComponent
          onClose={() => setAgentDialogOpen(false)}
          onSave={(agentId: string) => {
            handleAgentChange(agentId, 'execution_agent_id');
            setAgentDialogOpen(false);          
            }}
        />
      </Dialog> */}
    </Box>
  );
};

export default Task;
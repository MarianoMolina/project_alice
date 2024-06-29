import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Grid,
  Dialog,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { createItem, updateItem, fetchItem } from '../../services/api';
import { AliceTask, AliceAgent, Prompt, FunctionParameters } from '../../utils/types';
import useStyles from '../../styles/FunctionStyles';

interface FunctionProps {
  functionId?: string;
  onClose: () => void;
  viewOnly?: boolean;
}

const Function: React.FC<FunctionProps> = ({ functionId, onClose, viewOnly = false }) => {
  const classes = useStyles();
  const [task, setTask] = useState<Partial<AliceTask>>({
    task_name: '',
    task_description: '',
    task_type: 'BasicAgentTask',
    input_variables: null,
    exit_codes: new Map<string, string>(),
    recursive: false,
    templates: new Map<string, string>(),
    tasks: [],
    agent_name: null,
    valid_languages: [],
    timeout: null,
    prompts_to_add: null,
    exit_code_response_map: null,
    start_task: null,
    task_selection_method: null,
    tasks_end_code_routing: null,
    max_attempts: 3,
    agent_id: null,
    execution_agent_id: null,
    human_input: false,
  });

  const [agents, setAgents] = useState<AliceAgent[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [allTasks, setAllTasks] = useState<AliceTask[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (functionId) {
        const fetchedTask = await fetchItem('tasks', functionId);
        setTask(fetchedTask);
      }
      const fetchedAgents = await fetchItem('agents');
      const fetchedPrompts = await fetchItem('prompts');
      const fetchedTasks = await fetchItem('tasks');
      setAgents(fetchedAgents);
      setPrompts(fetchedPrompts);
      setAllTasks(fetchedTasks);
    };
    fetchData();
  }, [functionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (viewOnly) return;
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    if (viewOnly) return;
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (viewOnly) return;
    const { name, checked } = e.target;
    setTask((prev) => ({ ...prev, [name]: checked }));
  };

  const handleMapChange = (mapName: keyof AliceTask, key: string, value: string | number) => {
    if (viewOnly) return;
    setTask((prev) => {
      const updatedMap = new Map(prev[mapName] as Map<string, string | number>);
      updatedMap.set(key, value);
      return { ...prev, [mapName]: updatedMap };
    });
  };

  const handleArrayChange = (arrayName: keyof AliceTask, value: any[]) => {
    if (viewOnly) return;
    setTask((prev) => ({ ...prev, [arrayName]: value }));
  };

  const handleSave = async () => {
    if (viewOnly) return;
    try {
      if (functionId) {
        await updateItem('tasks', functionId, task);
      } else {
        await createItem('tasks', task);
      }
      onClose();
    } catch (error) {
      console.error('Error saving function:', error);
    }
  };

  return (
    <Box className={classes.container}>
      <Typography variant="h6">{viewOnly ? 'View Function' : (functionId ? 'Edit Function' : 'Create New Function')}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Task Name"
            name="task_name"
            value={task.task_name}
            onChange={handleChange}
            disabled={viewOnly}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Task Description"
            name="task_description"
            value={task.task_description}
            onChange={handleChange}
            disabled={viewOnly}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Task Type</InputLabel>
            <Select
              name="task_type"
              value={task.task_type}
              onChange={handleSelectChange}
              disabled={viewOnly}
            >
              {["CVGenerationTask", "RedditSearchTask", "APITask", "WikipediaSearchTask", "GoogleSearchTask", "ExaSearchTask", "ArxivSearchTask", "BasicAgentTask", "PromptAgentTask", "CheckTask", "CodeGenerationLLMTask", "CodeExecutionLLMTask", "AgentWithFunctions"].map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Valid Languages (comma-separated)"
            name="valid_languages"
            value={task.valid_languages?.join(', ')}
            onChange={(e) => handleArrayChange('valid_languages', e.target.value.split(',').map(lang => lang.trim()))}
            disabled={viewOnly}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Timeout (in seconds)"
            name="timeout"
            type="number"
            value={task.timeout || ''}
            onChange={handleChange}
            disabled={viewOnly}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Max Attempts"
            name="max_attempts"
            type="number"
            value={task.max_attempts || ''}
            onChange={handleChange}
            disabled={viewOnly}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={task.recursive || false}
                onChange={handleSwitchChange}
                name="recursive"
                disabled={viewOnly}
              />
            }
            label="Recursive"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={task.human_input || false}
                onChange={handleSwitchChange}
                name="human_input"
                disabled={viewOnly}
              />
            }
            label="Human Input"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Agent</InputLabel>
            <Select
              name="agent_id"
              value={(task.agent_id && typeof task.agent_id === 'string') ? task.agent_id : ''}
              onChange={handleSelectChange}
              disabled={viewOnly}
            >
              {agents.map((agent) => (
                <MenuItem key={agent._id} value={agent._id || ''}>{agent.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Execution Agent</InputLabel>
            <Select
              name="execution_agent_id"
              value={(task.execution_agent_id && typeof task.execution_agent_id === 'string') ? task.execution_agent_id : ''}
              onChange={handleSelectChange}
              disabled={viewOnly}
            >
              {agents.map((agent) => (
                <MenuItem key={agent._id} value={agent._id || ''}>{agent.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* <Grid item xs={12}>
          <Typography variant="subtitle1">Sub-Tasks</Typography>
          {task.tasks && (task.tasks as Map<string, string>[]).map((subtask, index) => (
            <Chip
              key={index}
              label={`Task ${index + 1}`}
              onDelete={viewOnly ? undefined : () => {
                const newTasks = [...(task.tasks || [])];
                newTasks.splice(index, 1);
                handleArrayChange('tasks', newTasks);
              }}
            />
          ))}
          {!viewOnly && (
            <Button onClick={() => {
              // Open a dialog to select tasks to add
            }}>
              Add Sub-Task
            </Button>
          )}
        </Grid> */}
      </Grid>
      {!viewOnly && (
        <Button variant="contained" onClick={handleSave} className={classes.button}>
          {functionId ? 'Update Function' : 'Create Function'}
        </Button>
      )}
    </Box>
  );
};

export default Function;
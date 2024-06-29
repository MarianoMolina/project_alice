import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Box,
  Typography,
  Slider,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { SupportAgent, PrecisionManufacturing, Functions, Visibility, Edit, Add } from '@mui/icons-material';
import { fetchItem } from '../../services/api';
import { AliceAgent, AliceTask, AliceModel, LLMConfig, CreateAliceChat } from '../../utils/types';
import Agent from './Agent';
import Model from './Model';
import Function from './Function';
import useStyles from '../../styles/NewChatStyles';

interface NewChatProps {
  open: boolean;
  onClose: () => void;
  onChatCreated: (chat: CreateAliceChat) => void;
}

const NewChat: React.FC<NewChatProps> = ({ open, onClose, onChatCreated }) => {
  const classes = useStyles();
  const [chatName, setChatName] = useState('New Chat');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedExecutor, setSelectedExecutor] = useState('6678997432793b02d478efdb');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [temperature, setTemperature] = useState<number>(0.9);
  const [timeout, setTimeout] = useState<number>(300);
  const [agents, setAgents] = useState<AliceAgent[]>([]);
  const [models, setModels] = useState<AliceModel[]>([]);
  const [tasks, setTasks] = useState<AliceTask[]>([]);

  const [openAgentDialog, setOpenAgentDialog] = useState(false);
  const [openModelDialog, setOpenModelDialog] = useState(false);
  const [openFunctionDialog, setOpenFunctionDialog] = useState(false);
  const [viewingAgent, setViewingAgent] = useState<AliceAgent | null>(null);
  const [viewingModel, setViewingModel] = useState<AliceModel | null>(null);
  const [viewingFunction, setViewingFunction] = useState<AliceTask | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const fetchedAgents = await fetchItem('agents');
      const fetchedModels = await fetchItem('models');
      const fetchedTasks = await fetchItem('tasks');
      setAgents(fetchedAgents);
      setModels(fetchedModels);
      setTasks(fetchedTasks);
    };
    fetchData();
  }, []);

  const handleCreateChat = async () => {
    if (!selectedAgent || !selectedModel) {
      alert('Please select an agent and a model');
      return;
    }

    const selectedModelData = models.find(model => model._id === selectedModel);
    
    if (!selectedModelData) {
      alert('Selected model not found');
      return;
    }

    const llmConfig: LLMConfig = {
      config_list: [{
        model: selectedModelData.model_name,
        api_key: selectedModelData.api_key,
        base_url: selectedModelData.base_url,
      }],
      temperature: temperature,
      timeout: timeout,
    };

    const newChat: CreateAliceChat = {
      name: chatName,
      alice_agent: selectedAgent,
      executor: selectedExecutor,
      functions: selectedFunctions,
      llm_config: llmConfig,
    };
    console.log('Selected Functions:', selectedFunctions);
    console.log('New Chat Object:', newChat);

    try {
      onChatCreated(newChat);
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat. Please try again.');
    }
  };

  const handleAgentChange = (event: SelectChangeEvent<string>) => {
    const agentId = event.target.value;
    setSelectedAgent(agentId);
    const agent = agents.find(a => a._id === agentId);
    setViewingAgent(agent || null);
  };

  const handleModelChange = (event: SelectChangeEvent<string>) => {
    const modelId = event.target.value;
    setSelectedModel(modelId);
    const model = models.find(m => m._id === modelId);
    setViewingModel(model || null);
  };

  const handleFunctionToggle = (functionId: string) => {
    setSelectedFunctions(prev => 
      prev.includes(functionId) 
        ? prev.filter(id => id !== functionId)
        : [...prev, functionId]
    );
  };

  const handleFunctionView = (functionId: string) => {
    const func = tasks.find(t => t._id === functionId);
    setViewingFunction(func || null);
    setOpenFunctionDialog(true);
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Chat</DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <TextField
          fullWidth
          label="Chat Name"
          value={chatName}
          onChange={(e) => setChatName(e.target.value)}
        />
        <Box className={classes.inlineContainer}>
          <FormControl fullWidth className={classes.formControl}>
            <InputLabel>Agent</InputLabel>
            <Select
              value={selectedAgent}
              onChange={handleAgentChange}
            >
              {agents.map((agent) => (
                <MenuItem key={agent._id} value={agent._id}>
                  <SupportAgent />
                  <ListItemText primary={agent.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Create New Agent">
            <IconButton onClick={() => setOpenAgentDialog(true)} className={classes.addButton}>
              <Add />
            </IconButton>
          </Tooltip>
        </Box>
        {viewingAgent && (
          <Box>
            <Typography variant="subtitle2">Selected Agent: {viewingAgent.name}</Typography>
            <Button 
              startIcon={<Edit />} 
              onClick={() => setOpenAgentDialog(true)}
              className={classes.viewButton}
            >
              Edit
            </Button>
          </Box>
        )}

        <Box className={classes.inlineContainer}>
          <FormControl fullWidth className={classes.formControl}>
            <InputLabel>Model</InputLabel>
            <Select
              value={selectedModel}
              onChange={handleModelChange}
            >
              {models.map((model) => (
                <MenuItem key={model._id} value={model._id}>
                  <PrecisionManufacturing />
                  <ListItemText primary={model.short_name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Create New Model">
            <IconButton onClick={() => setOpenModelDialog(true)} className={classes.addButton}>
              <Add />
            </IconButton>
          </Tooltip>
        </Box>
        {viewingModel && (
          <Box>
            <Typography variant="subtitle2">Selected Model: {viewingModel.short_name}</Typography>
            <Button 
              startIcon={<Edit />} 
              onClick={() => setOpenModelDialog(true)}
              className={classes.viewButton}
            >
              Edit
            </Button>
          </Box>
        )}

        <Typography gutterBottom>Temperature: {temperature}</Typography>
        <Slider
          value={temperature}
          onChange={(_, newValue) => setTemperature(newValue as number)}
          min={0}
          max={1}
          step={0.1}
          className={classes.slider}
        />
        <Typography gutterBottom>Timeout (seconds): {timeout}</Typography>
        <Slider
          value={timeout}
          onChange={(_, newValue) => setTimeout(newValue as number)}
          min={30}
          max={600}
          step={30}
          className={classes.slider}
        />
        <Box className={classes.inlineContainer}>
          <Typography variant="subtitle1" className={classes.functionsSection}>
            Functions
          </Typography>
          <Tooltip title="Create New Function">
            <IconButton onClick={() => setOpenFunctionDialog(true)} className={classes.addButton}>
              <Add />
            </IconButton>
          </Tooltip>
        </Box>
        <Box className={classes.chipContainer}>
          {tasks.map((task) => (
            <Chip
              key={task._id}
              icon={<Functions />}
              label={task.task_name}
              onClick={() => task._id && handleFunctionToggle(task._id)}
              onDelete={() => task._id && handleFunctionView(task._id)}
              deleteIcon={<Visibility />}
              color={task._id && selectedFunctions.includes(task._id) ? "primary" : "default"}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreateChat} variant="contained" color="primary">
          Create Chat
        </Button>
      </DialogActions>

      <Dialog open={openAgentDialog} onClose={() => setOpenAgentDialog(false)}>
        <Agent agentId={viewingAgent?._id} onClose={() => setOpenAgentDialog(false)} />
      </Dialog>

      <Dialog open={openModelDialog} onClose={() => setOpenModelDialog(false)}>
        <Model modelId={viewingModel?._id} onClose={() => setOpenModelDialog(false)} />
      </Dialog>

      <Dialog open={openFunctionDialog} onClose={() => setOpenFunctionDialog(false)}>
        <Function functionId={viewingFunction?._id} onClose={() => setOpenFunctionDialog(false)} />
      </Dialog>
    </Dialog>
  );
};

export default NewChat;
import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, MenuItem, Typography, Select, FormControl, InputLabel, Dialog } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { fetchItem, createItem, updateItem } from '../services/api';
import { AliceAgent, Prompt, User } from '../utils/types';
import PromptComponent from './PromptComponent';
import useStyles from './AgentStyles';

interface AgentProps {
  agentId?: string;
  onClose: () => void;
}

const Agent: React.FC<AgentProps> = ({ agentId, onClose }) => {
  const classes = useStyles();
  const [agent, setAgent] = useState<Partial<AliceAgent>>({});
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [openPromptDialog, setOpenPromptDialog] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const isNewAgent = !agentId;

  useEffect(() => {
    const fetchData = async () => {
      const promptsData = await fetchItem('prompts');
      setPrompts(promptsData);
      const usersData = await fetchItem('users');
      setUsers(usersData);

      if (agentId) {
        const agentData = await fetchItem('agents', agentId);
        setAgent(agentData);
        // Handle populated system_message
        if (agentData.system_message && typeof agentData.system_message === 'object' && agentData.system_message._id) {
          setSelectedPromptId(agentData.system_message._id);
        } else if (typeof agentData.system_message === 'string') {
          setSelectedPromptId(agentData.system_message);
        } else {
          setSelectedPromptId('');
        }
      }
    };
    fetchData();
  }, [agentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAgent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name === 'system_message') {
      setSelectedPromptId(value);
      setAgent((prev) => ({ ...prev, [name]: value }));
    } else {
      setAgent((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      const agentToSave = {
        ...agent,
        system_message: selectedPromptId // Ensure we're saving the ID, not the object
      };
      if (isNewAgent) {
        await createItem('agents', agentToSave);
      } else {
        await updateItem('agents', agentId!, agentToSave);
      }
      onClose();
    } catch (error) {
      console.error('Error saving agent:', error);
    }
  };

  const handleEditPrompt = (promptId: string | undefined) => {
    setSelectedPromptId(promptId || '');
    setOpenPromptDialog(true);
  };

  const handleClosePromptDialog = () => {
    setOpenPromptDialog(false);
  };

  const getSelectedPromptContent = () => {
    const selectedPrompt = prompts.find(prompt => prompt._id === selectedPromptId);
    return selectedPrompt ? selectedPrompt.content : 'No system message selected';
  };

  return (
    <Box className={classes.container}>
      <Typography variant="h6">{isNewAgent ? 'Create New Agent' : 'Edit Agent'}</Typography>
      <TextField
        fullWidth
        label="Name"
        name="name"
        value={agent.name || ''}
        onChange={handleChange}
        className={classes.formField}
      />
      <FormControl fullWidth className={classes.formField}>
        <InputLabel>System Message</InputLabel>
        <Select
          name="system_message"
          value={selectedPromptId}
          onChange={handleSelectChange}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {prompts.map((prompt) => (
            <MenuItem key={prompt._id} value={prompt._id}>
              {prompt.name}
            </MenuItem>
          ))}
        </Select>
        <Button onClick={() => handleEditPrompt(selectedPromptId)} sx={{ mt: 1 }}>
          {selectedPromptId ? 'Edit Prompt' : 'Create New Prompt'}
        </Button>
      </FormControl>
      <Box className={classes.promptContent}>
        <Typography variant="subtitle1">System Message Content:</Typography>
        <Typography variant="body2">{getSelectedPromptContent()}</Typography>
      </Box>
      <TextField
        fullWidth
        label="Functions"
        name="functions"
        value={agent.functions ? agent.functions.join(', ') : ''}
        onChange={handleChange}
        className={classes.formField}
      />
      <FormControl fullWidth className={classes.formField}>
        <InputLabel>Agent Class</InputLabel>
        <Select
          name="autogen_class"
          value={agent.autogen_class || 'ConversableAgent'}
          onChange={handleSelectChange}
        >
          <MenuItem value="ConversableAgent">ConversableAgent</MenuItem>
          <MenuItem value="AssistantAgent">AssistantAgent</MenuItem>
          <MenuItem value="UserProxyAgent">UserProxyAgent</MenuItem>
          <MenuItem value="GroupChatManager">GroupChatManager</MenuItem>
          <MenuItem value="LLaVAAgent">LLaVAAgent</MenuItem>
        </Select>
      </FormControl>
      <Button variant="contained" onClick={handleSave} className={classes.saveButton}>
        {isNewAgent ? 'Create' : 'Save'}
      </Button>
      <Dialog open={openPromptDialog} onClose={handleClosePromptDialog} fullWidth maxWidth="sm">
        <PromptComponent promptId={selectedPromptId} onClose={handleClosePromptDialog} />
      </Dialog>
    </Box>
  );
};

export default Agent;
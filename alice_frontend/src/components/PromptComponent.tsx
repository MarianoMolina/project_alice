import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { fetchItem, createItem, updateItem } from '../services/api';
import { Prompt } from '../utils/types';

interface PromptProps {
  promptId?: string;
  onClose: () => void;
}

const PromptComponent: React.FC<PromptProps> = ({ promptId, onClose }) => {
  const [prompt, setPrompt] = useState<Partial<Prompt>>({});
  const isNewPrompt = !promptId;

  useEffect(() => {
    const fetchData = async () => {
      if (promptId) {
        const promptData = await fetchItem('prompts', promptId);
        setPrompt(promptData);
      }
    };
    fetchData();
  }, [promptId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPrompt((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (isNewPrompt) {
        await createItem('prompts', prompt);
      } else {
        await updateItem('prompts', promptId!, prompt);
      }
      onClose();
    } catch (error) {
      console.error('Error saving prompt:', error);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">{isNewPrompt ? 'Create New Prompt' : 'Edit Prompt'}</Typography>
      <TextField
        fullWidth
        label="Name"
        name="name"
        value={prompt.name || ''}
        onChange={handleChange}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Content"
        name="content"
        multiline
        rows={4}
        value={prompt.content || ''}
        onChange={handleChange}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" onClick={handleSave} sx={{ mt: 2 }}>
        {isNewPrompt ? 'Create' : 'Save'}
      </Button>
    </Box>
  );
};

export default PromptComponent;

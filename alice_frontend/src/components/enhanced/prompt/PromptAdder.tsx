import React, { useState } from 'react';
import { Box, Button, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Prompt } from '../../../utils/PromptTypes';

interface PromptAdderProps {
  prompts: Prompt[];
  onAdd: (name: string, promptId: string) => void;
}

const PromptAdder: React.FC<PromptAdderProps> = ({ prompts, onAdd }) => {
  const [name, setName] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');

  const handleAdd = () => {
    if (name && selectedPrompt) {
      onAdd(name, selectedPrompt);
      setName('');
      setSelectedPrompt('');
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
      <TextField
        label="Variable Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Prompt</InputLabel>
        <Select
          value={selectedPrompt}
          onChange={(e) => setSelectedPrompt(e.target.value as string)}
          label="Prompt"
        >
          {prompts.map((prompt) => (
            <MenuItem key={prompt._id} value={prompt._id || ''}>
              {prompt.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button onClick={handleAdd} variant="contained">Add</Button>
    </Box>
  );
};

export default PromptAdder;
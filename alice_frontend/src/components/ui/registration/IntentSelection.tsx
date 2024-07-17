import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface IntentSelectionProps {
  onSelect: (intent: string) => void;
}

const IntentSelection: React.FC<IntentSelectionProps> = ({ onSelect }) => {
  const intents = [
    { id: 'research', label: 'Research and Information Gathering' },
    { id: 'coding', label: 'Coding and Development Assistance' },
    { id: 'general', label: 'General Purpose AI Assistant' },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        What do you primarily want to use Alice for?
      </Typography>
      {intents.map((intent) => (
        <Button
          key={intent.id}
          variant="outlined"
          fullWidth
          sx={{ mt: 1 }}
          onClick={() => onSelect(intent.id)}
        >
          {intent.label}
        </Button>
      ))}
    </Box>
  );
};

export default IntentSelection;
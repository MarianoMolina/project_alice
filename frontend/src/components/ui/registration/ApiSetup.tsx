import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { API } from '../../../types/ApiTypes';
import ApiTooltipView from '../../enhanced/api/api/ApiTooltipView';

interface ApiSetupProps {
  apis: API[];
  onApiSelect: (api: API) => void;
  onComplete: (bool: boolean) => void;
}

const ApiSetup: React.FC<ApiSetupProps> = ({ apis, onApiSelect, onComplete }) => {

  const handleComplete = () => {
    onComplete(true);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configure Your APIs
      </Typography>
      <ApiTooltipView items={apis} onInteraction={onApiSelect} item={null} onChange={() => { }} mode={'view'} handleSave={async () => { }} />
      <Button variant="contained" color="primary" onClick={handleComplete}>
        Complete Setup
      </Button>
    </Box>
  );
};

export default ApiSetup;
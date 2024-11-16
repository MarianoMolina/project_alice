import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ApiConfigTooltipView from '../../enhanced/api_config/api_config/ApiConfigTooltipView';
import { APIConfig } from '../../../types/ApiConfigTypes';

interface ApiSetupProps {
  apis: APIConfig[];
  onApiSelect: (api: APIConfig) => void;
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
      <ApiConfigTooltipView items={apis} onInteraction={onApiSelect} item={null} onChange={() => { }} mode={'view'} handleSave={async () => { }} />
      <Button variant="contained" color="primary" onClick={handleComplete}>
        Complete Setup
      </Button>
    </Box>
  );
};

export default ApiSetup;
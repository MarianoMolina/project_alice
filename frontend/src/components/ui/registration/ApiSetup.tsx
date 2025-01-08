import React, { useState } from 'react';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ApiConfigTooltipView from '../../enhanced/api_config/api_config/ApiConfigTooltipView';
import { APIConfig } from '../../../types/ApiConfigTypes';
import APICapabilitiesDialog from '../../enhanced/api/ApiCapabilitiesDialog';

interface ApiSetupProps {
  apis: APIConfig[];
  onApiSelect: (api: APIConfig) => void;
  onComplete: (bool: boolean) => void;
}

const ApiSetup: React.FC<ApiSetupProps> = ({ apis, onApiSelect, onComplete }) => {
  const [showCapabilities, setShowCapabilities] = useState(false);

  const handleComplete = () => {
    onComplete(true);
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Configure Your APIs
        </Typography>
        <Typography variant="body1" paragraph>
          To use Alice effectively, you'll need to configure at least one API for each capability 
          you want to use. Different APIs provide different capabilities - for example, OpenAI 
          and Anthropic provide, amongst other, chat models, while Bark specializes in text-to-speech.
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          While some default tasks might be configured for specific models or APIs, the tasks will default to an available API 
          that provides the required capability type (Chat, TTS, STT, etc.).
        </Alert>
        <Button
          startIcon={<InfoIcon />}
          onClick={() => setShowCapabilities(true)}
          variant="outlined"
          sx={{ mb: 3 }}
        >
          View API Capabilities
        </Button>
      </Paper>

      <ApiConfigTooltipView
        items={apis}
        onInteraction={onApiSelect}
        item={null}
        onChange={() => {}}
        mode={'view'}
        handleSave={async () => {}}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={handleComplete}
        sx={{ mt: 3 }}
      >
        Complete Setup
      </Button>

      <APICapabilitiesDialog
        open={showCapabilities}
        onClose={() => setShowCapabilities(false)}
      />
    </Box>
  );
};

export default ApiSetup;
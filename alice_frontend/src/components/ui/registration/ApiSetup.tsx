import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { API } from '../../../utils/ApiTypes';
import ApiTooltipView from '../../enhanced/api/api/ApiTooltipView';
import EnhancedAPI from '../../enhanced/api/api/EnhancedApi';

interface ApiSetupProps {
  apis: API[];
  onComplete: (configuredApis: API[]) => void;
}

const ApiSetup: React.FC<ApiSetupProps> = ({ apis, onComplete }) => {
  const [selectedApi, setSelectedApi] = useState<API | null>(null);
  const [configuredApis, setConfiguredApis] = useState<API[]>(apis);

  const handleApiSelect = (api: API) => {
    setSelectedApi(api);
  };

  const handleApiUpdate = (updatedApi: API) => {
    setConfiguredApis(prevApis => 
      prevApis.map(api => api._id === updatedApi._id ? updatedApi : api)
    );
    setSelectedApi(null);
  };

  const handleComplete = () => {
    onComplete(configuredApis);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configure Your APIs
      </Typography>
      <ApiTooltipView items={configuredApis} onInteraction={handleApiSelect} item={null} onChange={() => {}} mode={'view'} handleSave={async () => {}}/>
      {selectedApi && (
        <EnhancedAPI
          mode="edit"
          itemId={selectedApi._id}
          fetchAll={false}
          onSave={handleApiUpdate}
        />
      )}
      <Button variant="contained" color="primary" onClick={handleComplete}>
        Complete Setup
      </Button>
    </Box>
  );
};

export default ApiSetup;
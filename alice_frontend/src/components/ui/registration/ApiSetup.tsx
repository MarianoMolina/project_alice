import React, { useState } from 'react';
import { Box, Typography, Button, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import { API } from '../../../utils/ApiTypes';
import { API_TYPE_CONFIGS } from '../../../utils/ApiUtils';
import EnhancedAPI from '../../api/api/EnhancedApi';

interface ApiSetupProps {
  apis: API[];
  onComplete: (configuredApis: API[]) => void;
}

const ApiSetup: React.FC<ApiSetupProps> = ({ apis, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [configuredApis, setConfiguredApis] = useState<API[]>([]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleApiConfig = (api: API) => {
    setConfiguredApis((prev) => [...prev, api]);
    handleNext();
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} orientation="vertical">
        {apis.map((api, index) => (
          <Step key={index}>
            <StepLabel>{API_TYPE_CONFIGS[api.api_type].name}</StepLabel>
            <StepContent>
              <EnhancedAPI mode={'create'} fetchAll={true} onSave={handleApiConfig} apiType={api.api_type}/>;
              <Box sx={{ mb: 2 }}>
                <div>
                  <Button variant="contained" onClick={handleNext} sx={{ mt: 1, mr: 1 }}>
                    {index === apis.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                  <Button disabled={index === 0} onClick={handleBack} sx={{ mt: 1, mr: 1 }}>
                    Back
                  </Button>
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      {activeStep === apis.length && (
        <Box>
          <Typography>All APIs configured successfully.</Typography>
          <Button onClick={() => onComplete(configuredApis)}>Complete Registration</Button>
        </Box>
      )}
    </Box>
  );
};

export default ApiSetup;
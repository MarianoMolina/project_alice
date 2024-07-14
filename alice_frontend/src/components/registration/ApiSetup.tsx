import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import { API, ApiType } from '../../utils/ApiTypes';
import { API_TYPE_CONFIGS, LLM_PROVIDERS } from '../../utils/ApiUtils';

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

  const renderApiSetup = (api: API) => {
    const config = API_TYPE_CONFIGS[api.api_type];
    return (
      <Box>
        <Typography variant="h6">{config.name} Setup</Typography>
        <TextField
          label="API Name"
          fullWidth
          margin="normal"
          value={api.name}
          onChange={(e) => {
            api.name = e.target.value;
          }}
        />
        {Object.entries(config.apiConfig).map(([key, value]) => (
          <TextField
            key={key}
            label={key}
            fullWidth
            margin="normal"
            onChange={(e) => {
              api.api_config[key] = e.target.value;
            }}
          />
        ))}
        {api.api_type === ApiType.LLM_API && (
          <TextField
            select
            label="LLM Provider"
            fullWidth
            margin="normal"
            onChange={(e) => {
              const provider = e.target.value as keyof typeof LLM_PROVIDERS;
              api.api_config.provider = provider;
              api.api_config.base_url = LLM_PROVIDERS[provider].baseUrl;
            }}
          >
            {Object.entries(LLM_PROVIDERS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </TextField>
        )}
        <Button onClick={() => handleApiConfig(api)}>Save Configuration</Button>
      </Box>
    );
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} orientation="vertical">
        {apis.map((api, index) => (
          <Step key={index}>
            <StepLabel>{API_TYPE_CONFIGS[api.api_type].name}</StepLabel>
            <StepContent>
              {renderApiSetup(api)}
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
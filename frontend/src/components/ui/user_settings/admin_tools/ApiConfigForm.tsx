import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Paper,
  Grid,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { API_CAPABILITIES, ApiConfigType, apiNameIcons, initializeApiConfigMap } from '../../../../utils/ApiUtils';
import { ApiName } from '../../../../types/ApiTypes';

interface AdminApiConfigFormProps {
  initialConfig?: ApiConfigType;
  initialEnabledApis: Set<ApiName>;
  onSave: (config: ApiConfigType, enabledApis: Set<ApiName>) => void;
}

export const AdminApiConfigForm: React.FC<AdminApiConfigFormProps> = ({
  initialConfig,
  initialEnabledApis,
  onSave,
}) => {
  const [apiConfig, setApiConfig] = useState<ApiConfigType>(
    initialConfig || initializeApiConfigMap()
  );

  // Add this useEffect to update local state when props change
  useEffect(() => {
    if (initialConfig) {
      setApiConfig(initialConfig);
    }
  }, [initialConfig]);

  const [originalConfig] = useState<ApiConfigType>(apiConfig);
  const [enabledApis, setEnabledApis] = useState<Set<ApiName>>(initialEnabledApis);
  const [hasChanges, setHasChanges] = useState(false);
  const updateApiConfig = (
    apiName: ApiName,
    field: keyof ApiConfigType[typeof apiName],
    value: string
  ) => {
    setApiConfig(prev => ({
      ...prev,
      [apiName]: {
        ...prev[apiName],
        [field]: value
      } as ApiConfigType[typeof apiName]
    }));
  };

  const toggleApiEnabled = (apiName: ApiName) => {
    setEnabledApis(prev => {
      const newSet = new Set(prev);
      if (newSet.has(apiName)) {
        newSet.delete(apiName);
      } else {
        newSet.add(apiName);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const configsAreDifferent = JSON.stringify(apiConfig) !== JSON.stringify(originalConfig);
    const apisAreDifferent = JSON.stringify(Array.from(enabledApis).sort()) !==
      JSON.stringify(Array.from(initialEnabledApis).sort());
    setHasChanges(configsAreDifferent || apisAreDifferent);
  }, [apiConfig, originalConfig, enabledApis, initialEnabledApis]);

  const handleSave = () => {
    onSave(apiConfig, enabledApis);
    setHasChanges(false);
  };

  const renderConfigFields = (apiName: ApiName) => {
    const config = apiConfig[apiName];
    const fields = Object.keys(config);

    return (
      <Box key={apiName} component={Paper} p={2} mb={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} display="flex" alignItems="center" gap={1}>
            {apiNameIcons[apiName]}
            <Typography variant="h6">{apiName}</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={enabledApis.has(apiName)}
                  onChange={() => toggleApiEnabled(apiName)}
                />
              }
              label="Enabled"
            />
          </Grid>

          {fields.map(field => (
            <Grid item xs={12} sm={6} key={field}>
              <TextField
                fullWidth
                label={field.replace('_', ' ').toUpperCase()}
                value={config[field as keyof typeof config]}
                onChange={(e) => updateApiConfig(apiName, field as keyof typeof config, e.target.value)}
                disabled={!enabledApis.has(apiName)}
                type={field.includes('key') || field.includes('secret') ? 'password' : 'text'}
              />
            </Grid>
          ))}

          <Grid item xs={12}>
            <Typography variant="caption" color="textSecondary">
              Capabilities: {Array.from(API_CAPABILITIES[apiName]).join(', ')}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Admin API key map</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          Save Changes
        </Button>
      </Box>

      {Object.keys(apiConfig).map((apiName) =>
        renderConfigFields(apiName as ApiName)
      )}
    </Box>
  );
};

export default AdminApiConfigForm;
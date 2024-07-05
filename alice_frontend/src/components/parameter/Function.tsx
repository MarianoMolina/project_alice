import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  TextField,
  FormControlLabel,
  Paper,
  Alert,
  Grid
} from '@mui/material';
import { ParameterDefinition, FunctionParameters } from '../../utils/ParameterTypes';
import EnhancedParameter from './parameter/EnhancedParameter';
import { useConfig } from '../../context/ConfigContext';
import { IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import useStyles from './FunctionStyles';

interface ActiveParameter extends ParameterDefinition {
  isActive: boolean;
  name: string;
  isRequired: boolean;
}

interface FunctionDefinitionBuilderProps {
  initialParameters?: FunctionParameters;
  onChange?: (functionDefinition: FunctionParameters) => void;
  isViewOnly?: boolean;
}

const FunctionDefinitionBuilder: React.FC<FunctionDefinitionBuilderProps> = ({
  initialParameters,
  onChange,
  isViewOnly = false
}) => {
  const classes = useStyles();
  const { parameters } = useConfig();

  const ensurePropertiesObject = useCallback((params?: FunctionParameters): { [key: string]: ParameterDefinition } => {
    if (!params || !params.properties) return {};
    return params.properties;
  }, []);

  const initialActiveParameters = useMemo(() => {
    console.log('INITIAL PARAMETERS', initialParameters);
    console.log('PARAMETERS', parameters)
    const initialActiveParams: ActiveParameter[] = parameters.map(param => ({
      ...param,
      isActive: false,
      name: '',
      isRequired: false
    }));
    console.log('INITIAL ACTIVE PARAMETERS', initialActiveParams);
    if (initialParameters) {
      const propertiesObj = ensurePropertiesObject(initialParameters);
      Object.entries(propertiesObj).forEach(([key, value]) => {
        const index = initialActiveParams.findIndex(p => p._id === value._id);
        if (index !== -1) {
          initialActiveParams[index] = {
            ...initialActiveParams[index],
            ...value,
            isActive: true,
            name: key,
            isRequired: initialParameters.required.includes(key)
          };
        }
      });
    }
    console.log('FINAL ACTIVE PARAMETERS', initialActiveParams);
    return initialActiveParams;
  }, [parameters, initialParameters, ensurePropertiesObject]);

  const [activeParameters, setActiveParameters] = useState<ActiveParameter[]>(initialActiveParameters);
  
  const buildFunctionDefinition = useCallback((params: ActiveParameter[]): FunctionParameters => {
    const properties: { [key: string]: ParameterDefinition } = {};
    const required: string[] = [];

    params.forEach(param => {
      if (param.isActive && param.name.trim() !== '') {
        properties[param.name] = {
          type: param.type,
          description: param.description,
          default: param.default,
          _id: param._id
        };
        if (param.isRequired) {
          required.push(param.name);
        }
      }
    });

    const result: FunctionParameters = {
      type: "object",
      properties,
      required
    };
    return result;
  }, []);

  const handleParameterToggle = useCallback((paramId: string) => {
    setActiveParameters(prevParams => {
      const updatedParams = prevParams.map(param =>
        param._id === paramId
          ? { ...param, isActive: !param.isActive }
          : param
      );
      return updatedParams;
    });
  }, []);

  const handleNameChange = useCallback((paramId: string, name: string) => {
    setActiveParameters(prevParams => {
      const updatedParams = prevParams.map(param =>
        param._id === paramId ? { ...param, name } : param
      );
      return updatedParams;
    });
  }, []);

  const handleRequiredToggle = useCallback((paramId: string) => {
    setActiveParameters(prevParams => {
      const updatedParams = prevParams.map(param =>
        param._id === paramId ? { ...param, isRequired: !param.isRequired } : param
      );
      return updatedParams;
    });
  }, []);

  useEffect(() => {
    const functionDefinition = buildFunctionDefinition(activeParameters);
    if (!onChange) return;
    if (Object.keys(functionDefinition.properties).length > 0) {
      onChange(functionDefinition);
    }
  }, [activeParameters, buildFunctionDefinition, onChange]);

  const validationMessage = useMemo(() => {
    const activeParams = activeParameters.filter(p => p.isActive);
    const allNamed = activeParams.every(p => p.name.trim() !== '');
    const uniqueNames = new Set(activeParams.map(p => p.name)).size === activeParams.length;

    if (!allNamed) return "All active parameters must have a name";
    if (!uniqueNames) return "Parameter names must be unique";
    return null;
  }, [activeParameters]);
  return (
    <Paper elevation={3} className={classes.container}>

      {!isViewOnly && (
        <Typography variant="h6" gutterBottom>Function Definition Builder</Typography>
      )}
      {!isViewOnly && validationMessage && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {validationMessage}
        </Alert>
      )}
      <Grid container spacing={2}>
        {!isViewOnly && (
          <Grid item xs={6}>
            <Typography variant="subtitle1" gutterBottom>All Parameters</Typography>
            <Paper className={classes.parameterList}>
              <EnhancedParameter
                mode="list"
                fetchAll={true}
                isInteractable={true}
                onInteraction={(param: ParameterDefinition) => {
                  handleParameterToggle(param._id!);
                }}
              />
            </Paper>
          </Grid>
        )}
        <Grid item xs={isViewOnly ? 12 : 6}>
          <Typography variant="subtitle1" gutterBottom>Active Parameters</Typography>
          <Paper className={classes.parameterList}>
            {activeParameters.filter(param => param.isActive).length > 0 ? (
              <List>
                {activeParameters.filter(param => param.isActive).map((param) => (
                  <ListItem key={param._id}>
                    <ListItemText
                      primary={
                        <TextField
                          label="Parameter Name"
                          value={param.name}
                          onChange={(e) => handleNameChange(param._id!, e.target.value)}
                          error={param.name.trim() === ''}
                          helperText={param.name.trim() === '' ? 'Name is required' : ''}
                          fullWidth
                          margin="normal"
                          disabled={isViewOnly}
                        />
                      }
                      secondary={
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={param.isRequired}
                              onChange={() => handleRequiredToggle(param._id!)}
                              disabled={isViewOnly}
                            />
                          }
                          label="Required"
                        />
                      }
                    />
                    {!isViewOnly && (
                      <Tooltip title="Deactivate">
                        <IconButton
                          edge="end"
                          aria-label="deactivate"
                          onClick={() => handleParameterToggle(param._id!)}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box p={2} display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="body1" color="text.secondary">
                  None
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FunctionDefinitionBuilder;
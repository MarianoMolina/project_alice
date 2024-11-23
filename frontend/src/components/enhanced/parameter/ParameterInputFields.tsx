import React from 'react';
import { 
  TextField, 
  Box, 
  Switch,
  FormControlLabel,
  Typography
} from '@mui/material';
import { FunctionParameters, ParameterDefinition } from '../../../types/ParameterTypes';
import Logger from '../../../utils/Logger';
import { formatCamelCaseString } from '../../../utils/StyleUtils';

// Type-specific input components
const StringInput = ({ 
  param, 
  value, 
  onChange 
}: { 
  param: ParameterDefinition; 
  value: string; 
  onChange: (value: string) => void; 
}) => (
  <TextField
    fullWidth
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    multiline
    rows={3}
    helperText={`Type: string - ${param.description}`}
  />
);

const NumberInput = ({ 
  param, 
  value, 
  onChange,
  isInteger = false
}: { 
  param: ParameterDefinition; 
  value: number | undefined; 
  onChange: (value: number | undefined) => void;
  isInteger?: boolean;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Handle empty input
    if (inputValue === '') {
      onChange(undefined);
      return;
    }

    // Only allow numeric input (and decimal point for non-integers)
    const regex = isInteger ? /^\d*$/ : /^\d*\.?\d*$/;
    if (!regex.test(inputValue)) {
      return;
    }

    const parsedValue = isInteger ? 
      parseInt(inputValue, 10) : 
      parseFloat(inputValue);

    // Only update if it's a valid number
    if (!isNaN(parsedValue)) {
      onChange(parsedValue);
    }
  };

  return (
    <TextField
      fullWidth
      type="text" // Changed from "number" to prevent browser's number input behavior
      value={value ?? ''} // Use empty string when value is undefined
      onChange={handleChange}
      inputProps={{
        inputMode: isInteger ? 'numeric' : 'decimal', // Better mobile keyboard
        pattern: isInteger ? '[0-9]*' : '[0-9]*[.,]?[0-9]*' // HTML5 pattern for validation
      }}
      helperText={`Type: ${isInteger ? 'integer' : 'number'} - ${param.description}`}
    />
  );
};

const toBooleanValue = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
};

const BooleanInput = ({ 
  param, 
  value, 
  onChange 
}: { 
  param: ParameterDefinition; 
  value: any; 
  onChange: (value: boolean) => void; 
}) => {
  Logger.debug('BooleanInput props:', { 
    paramName: param.description, 
    currentValue: value,
    valueType: typeof value 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    Logger.debug('Boolean Switch changed:', {
      previous: value,
      previousType: typeof value,
      new: newValue,
      eventTarget: e.target.checked
    });
    onChange(newValue);
  };

  // Convert the value to a proper boolean
  const isChecked = toBooleanValue(value);

  Logger.debug('Boolean Switch rendered with:', { 
    originalValue: value, 
    convertedValue: isChecked 
  });

  return (
    <FormControlLabel
      control={
        <Switch
          checked={isChecked}
          onChange={handleChange}
        />
      }
      label={
        <Box>
          <Typography variant="caption" color="textSecondary">
            Type: boolean - {param.description}
          </Typography>
        </Box>
      }
    />
  );
};


const JsonInput = ({ 
  param, 
  value, 
  onChange 
}: { 
  param: ParameterDefinition; 
  value: string; 
  onChange: (value: string) => void; 
}) => {
  const isValid = (str: string): boolean => {
    if (!str) return true;
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const formatJson = (value: string): string => {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  };

  const error = Boolean(value && !isValid(value));

  return (
    <TextField
      fullWidth
      value={value ? formatJson(value) : ''}
      onChange={(e) => onChange(e.target.value)}
      multiline
      rows={4}
      error={error}
      helperText={error ? 'Invalid JSON format' : `Type: object/array - ${param.description}`}
    />
  );
};

interface ParameterInputFieldsProps {
  parameters: FunctionParameters;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  title?: string;
  className?: string;
}

const ParameterInputFields = ({
  parameters,
  values,
  onChange,
  title,
  className = ''
}: ParameterInputFieldsProps) => {
  const renderInputField = (key: string, param: ParameterDefinition) => {
    const handleChange = (value: any) => {
      Logger.debug('Parameter value changing:', {
        key,
        previousValue: values[key],
        newValue: value,
        paramType: param.type
      });
      onChange(key, value);
    };
    
    switch (param.type) {
      case 'string':
        return (
          <StringInput
            param={param}
            value={values[key]}
            onChange={handleChange}
          />
        );
      
      case 'integer':
        return (
          <NumberInput
            param={param}
            value={values[key]}
            onChange={handleChange}
            isInteger
          />
        );
      
      case 'number':
        return (
          <NumberInput
            param={param}
            value={values[key]}
            onChange={handleChange}
          />
        );
      
      case 'boolean':
        return (
          <BooleanInput
            param={param}
            value={values[key]}
            onChange={handleChange}
          />
        );
      
      case 'object':
      case 'array':
        return (
          <JsonInput
            param={param}
            value={values[key]}
            onChange={handleChange}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Box className={className}>
      {title && (
        <Typography variant="h6" className="mb-4">{title}</Typography>
      )}
      <Box className="space-y-4">
        {parameters?.properties && 
          Object.entries(parameters.properties).map(([key, param]) => (
            <Box key={key} className="mb-4">
              <Typography variant="body1" className="mb-2">{formatCamelCaseString(key)}</Typography>
              {renderInputField(key, param)}
            </Box>
          ))
        }
      </Box>
    </Box>
  );
};

export default ParameterInputFields;
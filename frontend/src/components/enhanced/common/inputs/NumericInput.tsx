import React from 'react';
import { TextField, FormHelperText } from '@mui/material';
import { NumericInputProps } from '../../../../types/InputTypes';
import { BaseInputWrapper } from './BaseInputWrapper';
import theme from '../../../../Theme';

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  name,
  label,
  title,
  hideTitle,
  titleVariant,
  error,
  required = false,
  disabled = false,
  description,
  placeholder,
  className,
  fullWidth = true,
  min,
  max,
  step,
  isInteger = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (val === '') {
      onChange(undefined);
      return;
    }

    const parseFn = isInteger ? parseInt : parseFloat;
    const num = parseFn(val);
    
    if (!isNaN(num)) {
      // Validate against min/max
      if (min !== undefined && num < min) return;
      if (max !== undefined && num > max) return;
      onChange(num);
    }
  };

  return (
    <BaseInputWrapper
      className={className}
    >
      <TextField
        name={name}
        label={label}
        InputLabelProps={{ sx: {backgroundColor: theme.palette.primary.dark}}}
        value={value ?? ''}
        onChange={handleChange}
        error={Boolean(error)}
        helperText={error}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        fullWidth={fullWidth}
        type="text"
        inputProps={{
          inputMode: isInteger ? 'numeric' : 'decimal',
          step,
          min,
          max,
          pattern: isInteger ? '[0-9]*' : '[0-9]*[.,]?[0-9]*',
        }}
      />
      {description && <FormHelperText>{description}</FormHelperText>}
    </BaseInputWrapper>
  );
};
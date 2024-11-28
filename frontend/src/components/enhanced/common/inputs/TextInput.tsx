import React from 'react';
import { TextField, FormHelperText } from '@mui/material';
import { TextInputProps } from '../../../../types/InputTypes';
import { BaseInputWrapper } from './BaseInputWrapper';
import theme from '../../../../Theme';

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  name,
  label,
  error,
  required = false,
  disabled = false,
  description,
  placeholder,
  className,
  fullWidth = true,
  multiline = false,
  rows = 1,
  maxLength,
  minLength,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value || undefined);
  };

  return (
    <BaseInputWrapper
      className={className}
      error={error}
      description={description}
    >
      <TextField
        name={name}
        label={label}
        InputLabelProps={{ sx: {backgroundColor: theme.palette.primary.dark}}}
        value={value || ''}
        onChange={handleChange}
        error={Boolean(error)}
        helperText={error}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        inputProps={{
          maxLength,
          minLength,
        }}
      />
    </BaseInputWrapper>
  );
};
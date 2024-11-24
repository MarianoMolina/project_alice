// components/common/inputs/TextInput.tsx
import React from 'react';
import { TextField, FormHelperText, Box } from '@mui/material';
import { TextInputProps } from '../../../../types/InputTypes';
import { BaseInputWrapper } from './BaseInputWrapper';

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
    >
      <TextField
        name={name}
        label={label}
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
      {description && <FormHelperText>{description}</FormHelperText>}
    </BaseInputWrapper>
  );
};
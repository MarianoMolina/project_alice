import React from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  Box
} from '@mui/material';
import { SelectInputProps } from '../../../../types/InputTypes';
import { BaseInputWrapper } from './BaseInputWrapper';

export const SelectInput: React.FC<SelectInputProps> = ({
  value,
  onChange,
  name,
  label,
  error,
  required = false,
  disabled = false,
  description,
  className,
  fullWidth = true,
  options,
  multiple = false,
  clearable = false,
  maxItems,
}) => {
  const handleChange = (e: any) => {
    const newValue = e.target.value;
    if (multiple) {
      // Handle maxItems limit
      if (maxItems && newValue.length > maxItems) return;
      onChange(newValue as string[]);
    } else {
      onChange(newValue as string);
    }
  };

  return (
    <BaseInputWrapper
      className={className}
    >
      <FormControl
        className={className}
        fullWidth={fullWidth}
        error={Boolean(error)}
        required={required}
        disabled={disabled}
      >
        {label && <InputLabel>{label}</InputLabel>}
        <Select
          name={name}
          value={value || (multiple ? [] : '')}
          onChange={handleChange}
          multiple={multiple}
          renderValue={multiple ? (selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as string[]).map((value) => {
                const option = options.find(opt => opt.value === value);
                return <Chip key={value} label={option?.label || value} />;
              })}
            </Box>
          ) : undefined}
        >
          {clearable && !multiple && (
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{error}</FormHelperText>}
        {description && <FormHelperText>{description}</FormHelperText>}
      </FormControl>
    </BaseInputWrapper>
  );
};
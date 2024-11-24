import React from 'react';
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  FormHelperText,
  Box,
  Chip,
} from '@mui/material';
import { IconSelectInputProps, SelectionOptionWithIcon } from '../../../../types/InputTypes';
import { BaseInputWrapper } from './BaseInputWrapper';

export const IconSelectInput: React.FC<IconSelectInputProps> = ({
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
  className,
  fullWidth = true,
  options,
  multiple = false,
  clearable = false,
  maxItems,
  showSelectedIcon = true,
  chipDisplay = true,
  renderOption,
}) => {
  const handleChange = (e: any) => {
    const newValue = e.target.value;
    if (multiple) {
      if (maxItems && newValue.length > maxItems) return;
      onChange(newValue as string[]);
    } else {
      onChange(newValue as string);
    }
  };

  const defaultRenderOption = (option: SelectionOptionWithIcon) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {option.icon && option.icon}
      {option.label}
    </Box>
  );

  const renderValue = (selected: string | string[]) => {
    if (multiple) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
          {(selected as string[]).map((value) => {
            const option = options.find(opt => opt.value === value);
            if (!option) return null;
            
            return chipDisplay ? (
              <Chip
                key={value}
                label={option.label}
                icon={option.icon ? React.cloneElement(option.icon as React.ReactElement, { 
                  style: { marginLeft: '8px' } 
                }) : undefined}
                size="small"
              />
            ) : (
              <Box key={value} sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                {showSelectedIcon && option.icon && option.icon}
                {option.label}
              </Box>
            );
          })}
        </Box>
      );
    }
    
    const option = options.find(opt => opt.value === selected);
    if (!option) return '';
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showSelectedIcon && option.icon && option.icon}
        {option.label}
      </Box>
    );
  };

  return (
    <BaseInputWrapper
      className={className}
    >
      <FormControl 
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
          renderValue={renderValue}
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
              {renderOption ? renderOption(option) : defaultRenderOption(option)}
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{error}</FormHelperText>}
        {description && <FormHelperText>{description}</FormHelperText>}
      </FormControl>
    </BaseInputWrapper>
  );
};
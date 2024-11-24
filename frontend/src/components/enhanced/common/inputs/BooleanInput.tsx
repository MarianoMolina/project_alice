import React from 'react';
import {
  FormControlLabel,
  Switch,
  Checkbox,
  FormHelperText,
  Box
} from '@mui/material';
import { BooleanInputProps } from '../../../../types/InputTypes';
import { BaseInputWrapper } from './BaseInputWrapper';

export const BooleanInput: React.FC<BooleanInputProps> = ({
  value,
  onChange,
  name,
  label,
  error,
  required = false,
  disabled = false,
  description,
  className,
  labelPlacement = 'end',
  displayAsSwitch = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  const Control = displayAsSwitch ? Switch : Checkbox;

  return (
    <BaseInputWrapper
      className={className}
    >
      <FormControlLabel
        control={
          <Control
            name={name}
            checked={Boolean(value)}
            onChange={handleChange}
            required={required}
            disabled={disabled}
          />
        }
        label={label || ''}
        labelPlacement={labelPlacement}
      />
      {error && <FormHelperText error>{error}</FormHelperText>}
      {description && <FormHelperText>{description}</FormHelperText>}
    </BaseInputWrapper>
  );
};

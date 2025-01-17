import React from 'react';
import {
  FormControlLabel,
  Switch,
  Checkbox,
} from '@mui/material';
import { BooleanInputProps } from '../../../types/InputTypes';
import { BaseInputWrapper } from './BaseInputWrapper';

export const BooleanInput: React.FC<BooleanInputProps> = ({
  value,
  onChange,
  name,
  label,
  error,
  description,
  required = false,
  disabled = false,
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
      error={error}
      description={description}
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
    </BaseInputWrapper>
  );
};

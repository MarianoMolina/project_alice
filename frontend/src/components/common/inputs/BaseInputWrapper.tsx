import React from 'react';
import { Box, FormHelperText } from '@mui/material';
import { BaseInputProps } from '../../../types/InputTypes';

export const BaseInputWrapper = <T,>({
  children,
  className,
  error,
  description,
}: Pick<BaseInputProps<T>, 'className' | 'error' | 'description'> & {
  children: React.ReactNode;
}) => (
  <Box className={className} sx={{padding: 1}}>
    {children}
    {error && <FormHelperText error>{error}</FormHelperText>}
    {description && <FormHelperText>{description}</FormHelperText>}
  </Box>
);
import React from 'react';
import { Box } from '@mui/material';
import { BaseInputProps } from '../../../../types/InputTypes';

export const BaseInputWrapper = <T,>({
  children,
  className,
}: Pick<BaseInputProps<T>, 'className'> & {
  children: React.ReactNode;
}) => (
  <Box className={className} sx={{padding: 1}}>
    {children}
  </Box>
);
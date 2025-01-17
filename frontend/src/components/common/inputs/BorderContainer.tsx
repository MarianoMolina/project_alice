import { ReactNode } from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import theme from '../../../Theme';

interface BorderedContainerProps {
  children: ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
}

const BorderedContainer = ({ children, className, sx }: BorderedContainerProps) => {
  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        p: 2,
        border: '1px solid',
        borderColor: theme.palette.grey[700],
        borderRadius: 1,
        mx: 1,
        ...sx
      }}
    >
      {children}
    </Box>
  );
};

export default BorderedContainer;
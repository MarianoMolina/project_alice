import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import '../App.css';

const Footer: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      className={`footer ${theme.palette.mode === 'light' ? 'footer-light' : 'footer-dark'}`}
    >
      <Typography variant="body1">
        Alice Workflow Manager © 2024
      </Typography>
    </Box>
  );
};

export default Footer;

import React from 'react';
import { Box, Typography } from '@mui/material';
import useStyles from './MarkdownStyles';

interface CommandLineLogProps {
  content: string;
}

export const CommandLineLog: React.FC<CommandLineLogProps> = ({ content }) => {
  const classes = useStyles();
  const lines = content.split('\n');

  return (
    <Box className={classes.rootLog}>
      {lines.map((line, index) => (
        <Typography key={index} variant="body2" className={classes.lineLog}>
          {line}
        </Typography>
      ))}
    </Box>
  );
};
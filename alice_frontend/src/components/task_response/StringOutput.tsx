import React from 'react';
import { Typography, Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface StringOutputProps {
  content: string[];
}

export const StringOutput: React.FC<StringOutputProps> = ({ content }) => {
  return (
    <Box>
      {content.map((item, index) => (
        <Typography key={index} component="div">
          <ReactMarkdown>{item}</ReactMarkdown>
        </Typography>
      ))}
    </Box>
  );
};
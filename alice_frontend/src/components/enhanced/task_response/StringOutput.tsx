import React from 'react';
import { Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface StringOutputProps {
  content: string;
}

export const StringOutput: React.FC<StringOutputProps> = ({ content }) => (
  <Typography component="div">
    <ReactMarkdown>{content}</ReactMarkdown>
  </Typography>
);
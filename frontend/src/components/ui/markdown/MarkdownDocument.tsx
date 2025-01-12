import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import CustomMarkdown from './CustomMarkdown';
import Logger from '../../../utils/Logger';

interface MarkdownDocumentProps {
  documentPath: string;
}

const MarkdownDocument: React.FC<MarkdownDocumentProps> = ({ documentPath }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(documentPath);

        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.statusText}`);
        }

        const text = await response.text();
        setContent(text);
      } catch (error) {
        Logger.error('Failed to load markdown document:', error);
        setError('Failed to load document. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [documentPath]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ overflowY: 'auto' , paddingX: 3, maxHeight: 'calc(100% - 32px)', marginBottom: 2, marginTop: 2 }}>
      <CustomMarkdown>{content}</CustomMarkdown>
    </Paper>
  );
};

export default MarkdownDocument;
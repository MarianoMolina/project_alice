import React from 'react';
import { Box, Typography, Link, Paper, Chip } from '@mui/material';
import useStyles from './TaskResponseStyles';
import CustomMarkdown from '../common/markdown/customMarkdown';

interface SearchResult {
  title: string;
  url: string;
  content: string;
  metadata?: Record<string, any>;
}

interface SearchOutputProps {
  result: SearchResult;
}

export const SearchOutput: React.FC<SearchOutputProps> = ({ result }) => {
  const classes = useStyles();

  return (
    <Paper elevation={1} className={classes.searchResultCard}>
      <Box className={classes.searchResultContent}>
        <Typography variant="subtitle1" className={classes.sectionLabel}>TITLE:</Typography>
        <Typography variant="h6" className={classes.searchResultTitle}>
          {result.title}
        </Typography>

        <Typography variant="subtitle1" className={classes.sectionLabel}>URL:</Typography>
        <Typography variant="body2" className={classes.searchResultUrl}>
          {result.url} [<Link href={result.url} target="_blank" rel="noopener noreferrer" color="primary">LINK</Link>]
        </Typography>

        <Typography variant="subtitle1" className={classes.sectionLabel}>CONTENT:</Typography>
        <Box className={classes.searchResultBody}>
          <CustomMarkdown children={result.content} />
        </Box>

        {result.metadata && Object.keys(result.metadata).length > 0 && (
          <>
            <Typography variant="subtitle1" className={classes.sectionLabel}>Metadata:</Typography>
            <Box className={classes.searchResultMetadata}>
              {Object.entries(result.metadata).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  size="small"
                  className={classes.metadataChip}
                />
              ))}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
};
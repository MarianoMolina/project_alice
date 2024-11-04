import React from 'react';
import { Box, Typography, Link, Paper, Chip } from '@mui/material';
import useStyles from './URLReferenceStyles';
import { URLReference } from '../../../types/URLReferenceTypes';
import CustomMarkdown from '../../ui/markdown/CustomMarkdown';
import { CopyButton } from '../../ui/markdown/CopyButton';
import AliceMarkdown from '../../ui/markdown/alice_markdown/AliceMarkdown';

interface URLReferenceViewerProps {
  result: URLReference;
}

export const URLReferenceViewer: React.FC<URLReferenceViewerProps> = ({ result }) => {
  const classes = useStyles();

  return (
    <Paper elevation={1} className={classes.urlReferenceCard}>
      <Box className={classes.urlReferenceContent}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" className={classes.sectionLabel}>TITLE:</Typography>
          <CopyButton code={JSON.stringify(result, null, 2)} />
        </Box>
        <Typography variant="h6" className={classes.urlReferenceTitle}>
          {result.title}
        </Typography>
        <Typography variant="subtitle1" className={classes.sectionLabel}>URL:</Typography>
        <Typography variant="body2" className={classes.urlReferenceUrl}>
          {result.url} [<Link href={result.url} target="_blank" rel="noopener noreferrer" color="primary">LINK</Link>]
        </Typography>
        <Typography variant="subtitle1" className={classes.sectionLabel}>CONTENT:</Typography>
        <AliceMarkdown showCopyButton>{result.content}</AliceMarkdown>
        {result.metadata && Object.keys(result.metadata).length > 0 && (
          <>
            <Typography variant="subtitle1" className={classes.sectionLabel}>Metadata:</Typography>
            <Box className={classes.urlReferenceMetadata}>
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
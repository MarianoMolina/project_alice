import React from 'react';
import { Box, Typography, Link, Paper, Chip } from '@mui/material';
import useStyles from './EntityReferenceStyles';
import { EntityReference } from '../../../types/EntityReferenceTypes';
import { CopyButton } from '../../ui/markdown/CopyButton';
import AliceMarkdown from '../../ui/markdown/alice_markdown/AliceMarkdown';

interface EntityReferenceViewerProps {
  result: EntityReference;
}

export const EntityReferenceViewer: React.FC<EntityReferenceViewerProps> = ({ result }) => {
  const classes = useStyles();

  return (
    <Paper elevation={1} className={classes.entityReferenceCard}>
      <Box className={classes.entityReferenceContent}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" className={classes.sectionLabel}>TITLE:</Typography>
          <CopyButton code={JSON.stringify(result, null, 2)} />
        </Box>
        <Typography variant="h6" className={classes.entityReferenceTitle}>
          {result.name}
        </Typography>
        <Typography variant="subtitle1" className={classes.sectionLabel}>URL:</Typography>
        <Typography variant="body2" className={classes.entityReferenceUrl}>
          {result.url} [<Link href={result.url} target="_blank" rel="noopener noreferrer" color="primary">LINK</Link>]
        </Typography>
        <Typography variant="subtitle1" className={classes.sectionLabel}>CONTENT:</Typography>
        <AliceMarkdown showCopyButton>{result.content ?? ''}</AliceMarkdown>
        {result.metadata && Object.keys(result.metadata).length > 0 && (
          <>
            <Typography variant="subtitle1" className={classes.sectionLabel}>Metadata:</Typography>
            <Box className={classes.entityReferenceMetadata}>
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
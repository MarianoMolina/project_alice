import React from 'react';
import { Box, Typography, Link, Paper, Chip } from '@mui/material';
import { EntityReference } from '../../../types/EntityReferenceTypes';
import { CopyButton } from '../../ui/markdown/CopyButton';
import AliceMarkdown from '../../ui/markdown/alice_markdown/AliceMarkdown';
import ImageReferenceViewer from './ImageReferenceViewer';

interface EntityReferenceViewerProps {
  result: EntityReference;
}

export const EntityReferenceViewer: React.FC<EntityReferenceViewerProps> = ({ result }) => {
  return (
    <Paper elevation={1} className="p-4">
      <Box className="space-y-4">
        <Box className="flex justify-between items-center">
          <Typography variant="subtitle1" className="font-medium text-gray-700">
            TITLE:
          </Typography>
          <CopyButton code={JSON.stringify(result, null, 2)} />
        </Box>

        <Typography variant="h6" className="text-lg font-semibold">
          {result.name}
        </Typography>

        {result.url && (
          <Box>
            <Typography variant="subtitle1" className="font-medium text-gray-700">
              URL:
            </Typography>
            <Typography variant="body2" className="break-all">
              {result.url} [
              <Link href={result.url} target="_blank" rel="noopener noreferrer" color="primary">
                LINK
              </Link>
              ]
            </Typography>
          </Box>
        )}

        {result.images && result.images.length > 0 && (
          <Box>
            <Typography variant="subtitle1" className="font-medium text-gray-700 mb-2">
              IMAGES:
            </Typography>
            <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.images.map((image, index) => (
                <ImageReferenceViewer
                  key={`${image.url}-${index}`}
                  image={image}
                />
              ))}
            </Box>
          </Box>
        )}
        {result.description && (
          <Box>
            <Typography variant="subtitle1" className="font-medium text-gray-700">
              DESCRIPTION:
            </Typography>
            <AliceMarkdown showCopyButton>{result.description}</AliceMarkdown>
          </Box>
        )}

        {result.content && (
          <Box>
            <Typography variant="subtitle1" className="font-medium text-gray-700">
              CONTENT:
            </Typography>
            <AliceMarkdown showCopyButton>{result.content ?? ''}</AliceMarkdown>
          </Box>
        )}

        {result.metadata && Object.keys(result.metadata).length > 0 && (
          <Box>
            <Typography variant="subtitle1" className="font-medium text-gray-700">
              Metadata:
            </Typography>
            <Box className="flex flex-wrap gap-2 mt-2">
              {Object.entries(result.metadata).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  size="small"
                  className="bg-gray-100"
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default EntityReferenceViewer;
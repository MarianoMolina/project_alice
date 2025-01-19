import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  TextFields,
  Visibility
} from '@mui/icons-material';
import { EmbeddingChunkComponentProps } from '../../../../types/EmbeddingChunkTypes';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';
import { useDialog } from '../../../../contexts/DialogContext';
import ContentStats from '../../../ui/markdown/ContentStats';

const EmbeddingChunkViewer: React.FC<EmbeddingChunkComponentProps> = ({ item }) => {
  const { selectCardItem } = useDialog();
  if (!item) {
    return null;
  }

  const handleCopyVector = () => {
    navigator.clipboard.writeText(JSON.stringify(item.vector));
  };

  return (
    <Paper className="relative overflow-hidden">
      <Box className="p-4">
        <Stack spacing={3}>
          {/* Header with Vector Copy */}
          <Box className="flex items-start justify-between">
            <Stack spacing={1}>
              <Typography variant="h6" className="font-semibold flex items-center gap-2">
                <TextFields className="text-gray-600" />
                Embedding Chunk #{item.index}
              </Typography>
              <ContentStats content={item.text_content} />
            </Stack>
            <Box className="flex items-center gap-2">
              <IconButton
                size="small"
                title="View embedding"
                className="text-gray-600 hover:text-gray-800"
                onClick={() => selectCardItem("EmbeddingChunk", item._id)}
              >
                <Visibility fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleCopyVector}
                size="small"
                title="Copy vector data"
                className="text-gray-600 hover:text-gray-800"
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Content */}
          <AliceMarkdown showCopyButton>{item.text_content}</AliceMarkdown>

          {/* Metadata */}
          {Object.keys(item.creation_metadata).length > 0 && (
            <Box>
              <Typography variant="subtitle2" className="text-gray-600 mb-2">
                Metadata
              </Typography>
              <Box className="flex flex-wrap gap-2">
                {Object.entries(item.creation_metadata).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${JSON.stringify(value)}`}
                    size="small"
                    variant="outlined"
                    className="text-gray-600"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

export default EmbeddingChunkViewer;
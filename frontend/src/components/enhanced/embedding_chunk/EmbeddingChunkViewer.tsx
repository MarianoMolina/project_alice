import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { EmbeddingChunk } from '../../../types/EmbeddingChunkTypes';
import { CopyButton } from '../../ui/markdown/CopyButton';
import AliceMarkdown from '../../ui/markdown/alice_markdown/AliceMarkdown';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const SectionLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1),
  fontWeight: 'bold',
}));

const Content = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const MetadataSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

interface EmbeddingChunkViewerProps {
  chunk: EmbeddingChunk;
}

const EmbeddingChunkViewer: React.FC<EmbeddingChunkViewerProps> = ({ chunk }) => {
  return (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Embedding Chunk {chunk.index}</Typography>
        <CopyButton code={JSON.stringify(chunk, null, 2)} />
      </Box>

      <Content>
        <SectionLabel variant="subtitle1">TEXT CONTENT:</SectionLabel>
        <AliceMarkdown showCopyButton>{chunk.text_content}</AliceMarkdown>
      </Content>

      <Content>
        <SectionLabel variant="subtitle1">VECTOR PREVIEW:</SectionLabel>
        <Typography variant="body2" color="textSecondary">
          Dimensions: {chunk.vector.length}
          {chunk.vector.length > 0 && ` | First 5 values: ${chunk.vector.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...`}
        </Typography>
      </Content>

      {Object.keys(chunk.creation_metadata).length > 0 && (
        <Content>
          <SectionLabel variant="subtitle1">METADATA:</SectionLabel>
          <MetadataSection>
            {Object.entries(chunk.creation_metadata).map(([key, value]) => (
              <Chip
                key={key}
                label={`${key}: ${JSON.stringify(value, null, 2)}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </MetadataSection>
        </Content>
      )}
    </StyledPaper>
  );
};

export default EmbeddingChunkViewer;
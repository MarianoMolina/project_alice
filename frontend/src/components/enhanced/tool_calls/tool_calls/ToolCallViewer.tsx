import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Api as ApiIcon,
  Code as CodeIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { ToolCallComponentProps } from '../../../../types/ToolCallTypes';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import { useDialog } from '../../../../contexts/DialogContext';

const ToolCallViewer: React.FC<ToolCallComponentProps> = ({ item }) => {
  const { selectCardItem } = useDialog();
  
  if (!item) return null;

  const handleViewDetails = () => {
    selectCardItem("ToolCall", item._id);
  };

  return (
    <Paper className="relative overflow-hidden">
      <Box className="p-4">
        <Stack spacing={3}>
          {/* Header */}
          <Box className="flex items-start justify-between">
            <Stack spacing={1}>
              <Box className="flex items-center gap-2">
                <ApiIcon className="text-gray-600" />
                <Typography variant="h6" className="font-semibold">
                  {formatCamelCaseString(item.function?.name)}
                </Typography>
              </Box>
              <Chip
                icon={<CodeIcon className="text-gray-600" />}
                label="Tool Call"
                size="small"
                variant="outlined"
                className="w-fit text-gray-600"
              />
            </Stack>
            <Tooltip title="View full details">
              <IconButton 
                onClick={handleViewDetails}
                size="small"
                className="text-gray-600"
              >
                <LaunchIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Arguments */}
          <Box>
            <Box className="mb-2 flex items-center gap-2">
              <Typography variant="subtitle2" className="text-gray-600">
                Arguments
              </Typography>
            </Box>
            <CodeBlock
              language="json"
              code={JSON.stringify(item.function?.arguments, null, 2)}
            />
          </Box>

          {/* Timestamp */}
          <Typography variant="caption" className="text-gray-500">
            Called on {new Date(item.createdAt || '').toLocaleString()}
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
};

export default ToolCallViewer;
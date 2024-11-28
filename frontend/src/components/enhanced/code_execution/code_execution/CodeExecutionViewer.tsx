import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Code as CodeIcon,
  Language as LanguageIcon,
  Terminal as TerminalIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { CodeExecutionComponentProps } from '../../../../types/CodeExecutionTypes';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';

const CodeExecutionViewer: React.FC<CodeExecutionComponentProps> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!item) return null;

  const hasOutput = item.code_output && item.code_output.output;
  const isSuccess = hasOutput && (!item.code_output.exit_code || item.code_output.exit_code === 0);

  return (
    <Paper className="relative overflow-hidden">
      <Box className="p-4">
        <Stack spacing={3}>
          {/* Header */}
          <Box className="flex items-center justify-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <CodeIcon className="text-gray-600" />
              <Stack spacing={1}>
                <Typography variant="h6" className="font-semibold">
                  Code Execution
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    icon={<LanguageIcon className="text-gray-600" />}
                    label={item.code_block.language}
                    size="small"
                    className="bg-gray-100"
                  />
                  {hasOutput && (
                    <Chip
                      icon={isSuccess ? <SuccessIcon className="text-green-600" /> : <ErrorIcon className="text-red-600" />}
                      label={isSuccess ? 'Success' : `Failed (${item.code_output.exit_code})`}
                      size="small"
                      className={isSuccess ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                    />
                  )}
                </Stack>
              </Stack>
            </Stack>
            <Typography variant="caption" className="text-gray-500">
              {new Date(item.createdAt || '').toLocaleDateString()}
            </Typography>
          </Box>

          {/* Output Section (if available) */}
          {hasOutput && (
            <Box className="bg-gray-50 rounded overflow-hidden">
              <Box className="flex items-center gap-2 px-3 py-2 bg-gray-100">
                <TerminalIcon fontSize="small" className="text-gray-600" />
                <Typography variant="subtitle2" className="text-gray-600">
                  Output
                </Typography>
              </Box>
              <Box className="p-3">
                <CodeBlock 
                  language="bash" 
                  code={item.code_output.output} 
                />
              </Box>
            </Box>
          )}

          {/* Code Section */}
          <Box>
            <Box 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-2" 
              onClick={() => setExpanded(!expanded)}
            >
              <Box className="flex items-center gap-2">
                <CodeIcon fontSize="small" className="text-gray-600" />
                <Typography variant="subtitle2" className="text-gray-600">
                  Source Code
                </Typography>
              </Box>
              <IconButton size="small">
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={expanded}>
              <Box className="mt-2">
                <CodeBlock 
                  language={item.code_block.language} 
                  code={item.code_block.code} 
                />
              </Box>
            </Collapse>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
};

export default CodeExecutionViewer;
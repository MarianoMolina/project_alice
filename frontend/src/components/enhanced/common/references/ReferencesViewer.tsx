import React from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';
import { References } from '../../../../types/ReferenceTypes';
import { NodeResponse } from '../../../../types/TaskResponseTypes';
import FileViewer from '../../file/FileViewer';
import { URLReferenceViewer } from '../../url_reference/URLReferenceViewer';
import EnhancedMessage from '../../message/message/EnhancedMessage';
import CustomMarkdown from '../../../ui/markdown/CustomMarkdown';
import { styled } from '@mui/material/styles';

interface ReferencesViewerProps {
  references: References;
}

const SubSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '&:last-child': {
    marginBottom: 0,
  },
}));

const ExitCodeChip = styled(Chip)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  '&.success': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
  '&.warning': {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  },
  '&.error': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
}));

const getExitCodeProps = (exitCode: number) => {
  switch (exitCode) {
    case 0:
      return { label: 'Exit: 0', className: 'success' };
    case 1:
      return { label: 'Exit: 1', className: 'error' };
    default:
      return { label: `Exit: ${exitCode}`, className: 'warning' };
  }
};

const ReferencesViewer: React.FC<ReferencesViewerProps> = ({ references }) => {
  if (!references) return null;

  const renderNodeReferences = (nodeReferences: NodeResponse[]) => {
    return (
      <Stack spacing={2}>
        {nodeReferences.map((nodeResponse, index) => (
          <SubSection key={`${nodeResponse.node_name}-${index}`}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {nodeResponse.node_name}
              {nodeResponse.exit_code !== undefined && (
                <ExitCodeChip
                  size="small"
                  {...getExitCodeProps(nodeResponse.exit_code)}
                />
              )}
            </Typography>
            <ReferencesViewer references={nodeResponse.references} />
          </SubSection>
        ))}
      </Stack>
    );
  };

  return (
    <Box>
      {references.messages && references.messages.length > 0 && (
        <SubSection>
          <Typography variant="h6">Messages</Typography>
          {references.messages.map((message, index) => (
            <EnhancedMessage
              key={message._id || `message-${index}`}
              mode={'detail'}
              fetchAll={false}
              itemId={message._id}
            />
          ))}
        </SubSection>
      )}
      
      {references.files && references.files.length > 0 && (
        <SubSection>
          <Typography variant="h6">Files</Typography>
          {references.files.map((file, index) => (
            <FileViewer key={file._id || `file-${index}`} file={file} />
          ))}
        </SubSection>
      )}

      {references.task_responses && references.task_responses.length > 0 && (
        <SubSection>
          <Typography variant="h6">Task Responses</Typography>
          {references.task_responses.map((taskResponse, index) => (
            <Box key={taskResponse._id || `task-response-${index}`}>
              {taskResponse.node_references ? (
                renderNodeReferences(taskResponse.node_references)
              ) : (
                <Typography>No output content available</Typography>
              )}
            </Box>
          ))}
        </SubSection>
      )}

      {references.url_references && references.url_references.length > 0 && (
        <SubSection>
          <Typography variant="h6">Search Results</Typography>
          {references.url_references.map((result, index) => (
            <URLReferenceViewer key={result.url || `search-result-${index}`} result={result} />
          ))}
        </SubSection>
      )}

      {references.string_outputs && references.string_outputs.length > 0 && (
        <SubSection>
          <Typography variant="h6">String Outputs</Typography>
          {references.string_outputs.map((output, index) => (
            <Box key={`string-output-${index}`} mb={1}>
              <CustomMarkdown>{output}</CustomMarkdown>
            </Box>
          ))}
        </SubSection>
      )}
    </Box>
  );
};

export default ReferencesViewer;
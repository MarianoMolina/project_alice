import React from 'react';
import { Box, Typography } from '@mui/material';
import { References } from '../../../../types/ReferenceTypes';
import FileViewer from '../../file/FileViewer';
import { URLReferenceViewer } from '../../url_reference/URLReferenceViewer';
import EnhancedMessage from '../../message/message/EnhancedMessage';
import CustomMarkdown from '../markdown/customMarkdown';

interface ReferencesViewerProps {
  references: References;
}

const ReferencesViewer: React.FC<ReferencesViewerProps> = ({ references }) => {
  if (!references) return null;

  return (
    <Box>
      {references.messages && references.messages.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Messages</Typography>
          {references.messages.map((message, index) => (
            <EnhancedMessage
              key={message._id || `message-${index}`}
              mode={'detail'}
              fetchAll={false}
              itemId={message._id}
            />
          ))}
        </Box>
      )}
      {references.files && references.files.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Files</Typography>
          {references.files.map((file, index) => (
            <FileViewer key={file._id || `file-${index}`} file={file} />
          ))}
        </Box>
      )}
      {references.task_responses && references.task_responses.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Task Responses</Typography>
          {references.task_responses.map((taskResponse, index) => (
            <Box key={taskResponse._id || `task-response-${index}`}>
              {/* <CustomMarkdown>{taskResponse.task_outputs ?? ''}</CustomMarkdown> */}
              <ReferencesViewer references={taskResponse.references ?? {}} />
            </Box>
          ))}
        </Box>
      )}
      {references.search_results && references.search_results.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Search Results</Typography>
          {references.search_results.map((result, index) => (
            <URLReferenceViewer key={result.url || `search-result-${index}`} result={result} />
          ))}
        </Box>
      )}
      {references.string_outputs && references.string_outputs.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">String Outputs</Typography>
          {references.string_outputs.map((output, index) => (
            <Box key={`string-output-${index}`} mb={1}>
              <CustomMarkdown>{output}</CustomMarkdown>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ReferencesViewer;
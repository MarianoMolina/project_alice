import React from 'react';
import { Box, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import Message from '../message/Message';
import { References } from '../../../../types/ReferenceTypes';
import FileViewer from '../../file/FileViewer';
import { WorkflowOutput } from '../../task_response/WorkflowOutput';
import { SearchOutput } from '../../task_response/SearchOutput';

interface ReferencesFullProps {
  references: References;
}

const ReferencesFull: React.FC<ReferencesFullProps> = ({ references }) => {
  return (
    <Box>
      {references.messages && references.messages.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Messages</Typography>
          {references.messages.map((message, index) => (
            <Message key={index} message={message} />
          ))}
        </Box>
      )}

      {references.files && references.files.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Files</Typography>
          {references.files.map((file, index) => (
            <FileViewer key={index} file={file} />
          ))}
        </Box>
      )}

      {references.task_responses && references.task_responses.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Task Responses</Typography>
          {references.task_responses.map((taskResponse, index) => (
            <WorkflowOutput key={index} content={[taskResponse]} />
          ))}
        </Box>
      )}

      {references.search_results && references.search_results.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">Search Results</Typography>
          {references.search_results.map((result, index) => (
            <SearchOutput key={index} result={result} />
          ))}
        </Box>
      )}

      {references.string_outputs && references.string_outputs.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">String Outputs</Typography>
          {references.string_outputs.map((output, index) => (
            <Box key={index} mb={1}>
              <ReactMarkdown>{output}</ReactMarkdown>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ReferencesFull;
import React from 'react';
import { Box, Typography } from '@mui/material';
import { References } from '../../../../types/ReferenceTypes';
import FileViewer from '../../file/FileViewer';
import { EntityReferenceViewer } from '../../entity_reference/EntityReferenceViewer';
import EnhancedMessage from '../../message/message/EnhancedMessage';
import EmbeddingChunkViewer from '../../embedding_chunk/EmbeddingChunkViewer';
import UserInteractionViewer from '../../user_interaction/UserInteractionViewer';
import NodeResponsesViewer from './NodeResponsesViewer';
import { useStyles } from './ReferencesStyles';

interface ReferencesViewerProps {
  references: References;
}

const ReferencesViewer: React.FC<ReferencesViewerProps> = ({ references }) => {
  const classes = useStyles();
  
  if (!references) return null;

  return (
    <Box>
      {references.messages && references.messages.length > 0 && (
        <Box className={classes.subSection}>
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
        <Box className={classes.subSection}>
          <Typography variant="h6">Files</Typography>
          {references.files.map((file, index) => (
            <FileViewer key={file._id || `file-${index}`} file={file} />
          ))}
        </Box>
      )}

      {references.task_responses && references.task_responses.length > 0 && (
        <Box className={classes.subSection}>
          <Typography variant="h6">Task Responses</Typography>
          {references.task_responses.map((taskResponse, index) => (
            <Box key={taskResponse._id || `task-response-${index}`}>
              {taskResponse.node_references && taskResponse.node_references.length > 0 ? (
                <NodeResponsesViewer nodeResponses={taskResponse.node_references} />
              ) : (
                <Typography>No output content available</Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {references.entity_references && references.entity_references.length > 0 && (
        <Box className={classes.subSection}>
          <Typography variant="h6">Entity References</Typography>
          {references.entity_references.map((result, index) => (
            <EntityReferenceViewer key={result.url || `search-result-${index}`} result={result} />
          ))}
        </Box>
      )}

      {references.user_interactions && references.user_interactions.length > 0 && (
        <Box className={classes.subSection}>
          <Typography variant="h6">User Interactions</Typography>
          {references.user_interactions.map((interaction, index) => (
            <UserInteractionViewer 
              key={interaction._id || `interaction-${index}`}
              interaction={interaction}
            />
          ))}
        </Box>
      )}

      {references.embeddings && references.embeddings.length > 0 && (
        <Box className={classes.subSection}>
          <Typography variant="h6">Embeddings</Typography>
          {references.embeddings.map((chunk, index) => (
            <EmbeddingChunkViewer
              key={chunk._id || `embedding-${index}`}
              chunk={chunk}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ReferencesViewer;
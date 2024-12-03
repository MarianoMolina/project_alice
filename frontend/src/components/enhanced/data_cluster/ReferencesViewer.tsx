import React from 'react';
import { Box, Typography } from '@mui/material';
import { References } from '../../../types/ReferenceTypes';
import FileViewer from '../file/file/FileViewer';
import EntityReferenceViewer from '../entity_reference/entity_reference/EntityReferenceViewer';
import EnhancedMessage from '../message/message/EnhancedMessage';
import EmbeddingChunkViewer from '../embedding_chunk/embedding_chunk/EmbeddingChunkViewer';
import UserInteractionViewer from '../user_interaction/user_interaction/UserInteractionViewer';
import TaskResponseViewer from '../task_response/task_response/TaskResponseViewer';
import { useStyles } from './ReferencesStyles';
import CodeExecutionViewer from '../code_execution/code_execution/CodeExecutionViewer';
import ToolCallViewer from '../tool_calls/tool_calls/ToolCallViewer';

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
          <Typography variant="body1">Messages</Typography>
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
          <Typography variant="body1">Files</Typography>
          {references.files.map((file, index) => (
            <FileViewer key={file._id || `file-${index}`}
              item={file}
              items={null} onChange={() => null} mode={'view'} handleSave={async () => { }}
            />
          ))}
        </Box>
      )}

      {references.task_responses && references.task_responses.length > 0 && (
        <Box className={classes.subSection}>
          <Typography variant="body1">Task Responses</Typography>
          {references.task_responses.map((taskResponse, index) => (
            <Box key={taskResponse._id || `task-response-${index}`}>
              {taskResponse.node_references && taskResponse.node_references.length > 0 ? (
                <TaskResponseViewer item={taskResponse} items={null} onChange={() => null} mode={'view'} handleSave={async () => { }} />
              ) : (
                <Typography>No output content available</Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {references.entity_references && references.entity_references.length > 0 && (
        <Box className={classes.subSection}>
          <Typography variant="body1">Entity References</Typography>
          {references.entity_references.map((result, index) => (
            <EntityReferenceViewer key={result.url || `search-result-${index}`}
              item={result}
              items={null} onChange={() => null} mode={'view'} handleSave={async () => { }}
            />
          ))}
        </Box>
      )}

      {references.user_interactions && references.user_interactions.length > 0 && (
        <Box className={classes.subSection}>
          <Typography variant="body1">User Interactions</Typography>
          {references.user_interactions.map((interaction, index) => (
            <UserInteractionViewer
              key={interaction._id || `interaction-${index}`}
              item={interaction}
              items={null} onChange={() => null} mode={'view'} handleSave={async () => { }}
            />
          ))}
        </Box>
      )}

      {references.embeddings && references.embeddings.length > 0 && (
        <Box className={classes.subSection}>
          <Typography variant="body1">Embeddings</Typography>
          {references.embeddings.map((chunk, index) => (
            <EmbeddingChunkViewer
              key={chunk._id || `embedding-${index}`}
              item={chunk}
              items={null} onChange={() => null} mode={'view'} handleSave={async () => { }}
            />
          ))}
        </Box>
      )}

      {references.tool_calls && references.tool_calls.length > 0 && (
        <Box className={classes.subSection}>
          <Typography variant="body1">Tool Calls</Typography>
          {references.tool_calls.map((toolCall, index) => (
            <ToolCallViewer
              key={toolCall._id || `tool-call-${index}`}
              item={toolCall}
              items={null} onChange={() => null} mode={'view'} handleSave={async () => { }}
            />
          ))}
        </Box>
      )}
      {references.code_executions && references.code_executions.length > 0 && (
        <Box className={classes.subSection}>
          <Typography variant="body1">Code Executions</Typography>
          {references.code_executions.map((codeExecution, index) => (
            <CodeExecutionViewer
              key={codeExecution._id || `code-execution-${index}`}
              item={codeExecution}
              items={null} onChange={() => null} mode={'view'} handleSave={async () => { }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ReferencesViewer;
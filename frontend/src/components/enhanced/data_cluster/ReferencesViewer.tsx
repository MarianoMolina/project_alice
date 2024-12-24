import React from 'react';
import { Box } from '@mui/material';
import { PopulatedReferences } from '../../../types/ReferenceTypes';
import FileViewer from '../file/file/FileViewer';
import EntityReferenceViewer from '../entity_reference/entity_reference/EntityReferenceViewer';
import EnhancedMessage from '../message/message/EnhancedMessage';
import EmbeddingChunkViewer from '../embedding_chunk/embedding_chunk/EmbeddingChunkViewer';
import UserInteractionViewer from '../user_interaction/user_interaction/UserInteractionViewer';
import TaskResponseViewer from '../task_response/task_response/TaskResponseViewer';
import CodeExecutionViewer from '../code_execution/code_execution/CodeExecutionViewer';
import ToolCallViewer from '../tool_calls/tool_calls/ToolCallViewer';
import ReferencesSection from './ReferencesSection';

interface ReferencesViewerProps {
  references: PopulatedReferences;
}

const ReferencesViewer: React.FC<ReferencesViewerProps> = ({ references }) => {
  if (!references) return null;

  const hasMessages = references.messages && references.messages.length > 0;
  const hasFiles = references.files && references.files.length > 0;
  const hasTaskResponses = references.task_responses && references.task_responses.length > 0;
  const hasEntityReferences = references.entity_references && references.entity_references.length > 0;
  const hasUserInteractions = references.user_interactions && references.user_interactions.length > 0;
  const hasEmbeddings = references.embeddings && references.embeddings.length > 0;
  const hasToolCalls = references.tool_calls && references.tool_calls.length > 0;
  const hasCodeExecutions = references.code_executions && references.code_executions.length > 0;

  return (
    <Box>
      {hasMessages && (
        <ReferencesSection title="Messages">
          {references.messages?.map((message, index) => (
            <EnhancedMessage
              key={message._id || `message-${index}`}
              mode={'detail'}
              fetchAll={false}
              itemId={message._id}
            />
          ))}
        </ReferencesSection>
      )}

      {hasFiles && (
        <ReferencesSection title="Files">
          {references.files?.map((file, index) => (
            <FileViewer 
              key={file._id || `file-${index}`}
              item={file}
              items={null}
              onChange={() => null}
              mode={'view'}
              handleSave={async () => {}}
            />
          ))}
        </ReferencesSection>
      )}

      {hasTaskResponses && (
        <ReferencesSection title="Task Responses">
          {references.task_responses?.map((taskResponse, index) => (
            taskResponse.node_references && taskResponse.node_references.length > 0 ? (
              <TaskResponseViewer 
                key={taskResponse._id || `task-response-${index}`}
                item={taskResponse}
                items={null}
                onChange={() => null}
                mode={'view'}
                handleSave={async () => {}}
              />
            ) : null
          )).filter(Boolean)}
        </ReferencesSection>
      )}

      {hasEntityReferences && (
        <ReferencesSection title="Entity References">
          {references.entity_references?.map((result, index) => (
            <EntityReferenceViewer
              key={result.url || `search-result-${index}`}
              item={result}
              items={null}
              onChange={() => null}
              mode={'view'}
              handleSave={async () => {}}
            />
          ))}
        </ReferencesSection>
      )}

      {hasUserInteractions && (
        <ReferencesSection title="User Interactions">
          {references.user_interactions?.map((interaction, index) => (
            <UserInteractionViewer
              key={interaction._id || `interaction-${index}`}
              item={interaction}
              items={null}
              onChange={() => null}
              mode={'view'}
              handleSave={async () => {}}
            />
          ))}
        </ReferencesSection>
      )}

      {hasEmbeddings && (
        <ReferencesSection title="Embeddings">
          {references.embeddings?.map((chunk, index) => (
            <EmbeddingChunkViewer
              key={chunk._id || `embedding-${index}`}
              item={chunk}
              items={null}
              onChange={() => null}
              mode={'view'}
              handleSave={async () => {}}
            />
          ))}
        </ReferencesSection>
      )}

      {hasToolCalls && (
        <ReferencesSection title="Tool Calls">
          {references.tool_calls?.map((toolCall, index) => (
            <ToolCallViewer
              key={toolCall._id || `tool-call-${index}`}
              item={toolCall}
              items={null}
              onChange={() => null}
              mode={'view'}
              handleSave={async () => {}}
            />
          ))}
        </ReferencesSection>
      )}

      {hasCodeExecutions && (
        <ReferencesSection title="Code Executions">
          {references.code_executions?.map((codeExecution, index) => (
            <CodeExecutionViewer
              key={codeExecution._id || `code-execution-${index}`}
              item={codeExecution}
              items={null}
              onChange={() => null}
              mode={'view'}
              handleSave={async () => {}}
            />
          ))}
        </ReferencesSection>
      )}
    </Box>
  );
};

export default ReferencesViewer;
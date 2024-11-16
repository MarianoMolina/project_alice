import Logger from "../utils/Logger";
import { CodeExecution } from "./CodeExecutionTypes";
import { EmbeddingChunk } from "./EmbeddingChunkTypes";
import { EntityReference } from "./EntityReferenceTypes";
import { FileContentReference, FileReference } from "./FileTypes";
import { MessageType } from "./MessageTypes";
import { TaskResponse } from "./TaskResponseTypes";
import { ToolCall } from "./ToolCallTypes";
import { UserInteraction } from "./UserInteractionTypes";

export type ReferenceType =
  | MessageType
  | FileReference
  | FileContentReference
  | TaskResponse
  | EntityReference
  | UserInteraction
  | EmbeddingChunk
  | CodeExecution
  | ToolCall
  | string;

export interface References {
  messages?: MessageType[];
  files?: (FileReference | FileContentReference)[];
  task_responses?: TaskResponse[];
  user_interactions?: UserInteraction[];
  embeddings?: EmbeddingChunk[];
  entity_references?: EntityReference[];
  code_executions?: CodeExecution[];
  tool_calls?: ToolCall[];
}

export function hasAnyReferences(references: References): boolean {
  Logger.debug("Checking references:", references);
  return (
    (references.messages?.length ?? 0) > 0 ||
    (references.files?.length ?? 0) > 0 ||
    (references.task_responses?.length ?? 0) > 0 ||
    (references.user_interactions?.length ?? 0) > 0 ||
    (references.embeddings?.length ?? 0) > 0 || 
    (references.entity_references?.length ?? 0) > 0 ||
    (references.code_executions?.length ?? 0) > 0 ||
    (references.tool_calls?.length ?? 0) > 0
  );
}

export function howManyReferences(references: References): number {
  return (
    (references.messages?.length ?? 0) +
    (references.files?.length ?? 0) +
    (references.task_responses?.length ?? 0) +
    (references.user_interactions?.length ?? 0) +
    (references.embeddings?.length ?? 0) +
    (references.entity_references?.length ?? 0) + 
    (references.code_executions?.length ?? 0) +
    (references.tool_calls?.length ?? 0)
  );
}

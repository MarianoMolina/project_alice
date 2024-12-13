import Logger from "../utils/Logger";
import { CodeExecution, convertToPopulatedCodeExecution } from "./CodeExecutionTypes";
import { convertToEmbeddingChunk, EmbeddingChunk } from "./EmbeddingChunkTypes";
import { convertToPopulatedEntityReference, EntityReference } from "./EntityReferenceTypes";
import { convertToPopulatedFileReference, FileContentReference, FileReference } from "./FileTypes";
import { convertToPopulatedMessage, MessageType } from "./MessageTypes";
import { convertToPopulatedTaskResponse, TaskResponse } from "./TaskResponseTypes";
import { convertToPopulatedToolCall, ToolCall } from "./ToolCallTypes";
import { convertToPopulatedUserInteraction, UserInteraction } from "./UserInteractionTypes";

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

export enum OutputType {
  MESSAGE = "message",
  FILE = "file",
  TASK_RESPONSE = "task_response",
  USER_INTERACTION = "user_interaction",
  EMBEDDING = "embedding",
  ENTITY_REFERENCE = "entity_reference",
  CODE_EXECUTION = "code_execution",
  TOOL_CALL = "tool_call",
}

export interface References {
  messages?: string[];
  files?: string[];
  task_responses?: string[];
  user_interactions?: string[];
  embeddings?: string[];
  entity_references?: string[];
  code_executions?: string[];
  tool_calls?: string[];
}

// Define the populated types
type PopulatedFields = {
  messages?: MessageType[];
  files?: (FileReference | FileContentReference)[];
  task_responses?: TaskResponse[];
  user_interactions?: UserInteraction[];
  embeddings?: EmbeddingChunk[];
  entity_references?: EntityReference[];
  code_executions?: CodeExecution[];
  tool_calls?: ToolCall[];
}

// Create the populated interface
export interface PopulatedReferences extends Omit<References, keyof PopulatedFields>, PopulatedFields {}

export const convertToReferences = (data: any): References => {
  return {
    messages: data?.messages || [],
    files: data?.files || [],
    task_responses: data?.task_responses || [],
    user_interactions: data?.user_interactions || [],
    embeddings: data?.embeddings || [],
    entity_references: data?.entity_references || [],
    code_executions: data?.code_executions || [],
    tool_calls: data?.tool_calls || [],
  };
}

export const convertToPopulatedReferences = (data: any): PopulatedReferences => {
  return {
    messages: data?.messages ? data.messages.map((message: any) => convertToPopulatedMessage(message)) : [],
    files: data?.files ? data.files.map((file: any) => convertToPopulatedFileReference(file)) : [],
    task_responses: data?.task_responses ? data.task_responses.map((task_response: any) => convertToPopulatedTaskResponse(task_response)) : [],
    user_interactions: data?.user_interactions ? data.user_interactions.map((user_interaction: any) => convertToPopulatedUserInteraction(user_interaction)) : [],
    embeddings: data?.embeddings ? data.embeddings.map((embedding: any) => convertToEmbeddingChunk(embedding)) : [],
    entity_references: data?.entity_references ? data.entity_references.map((entity_reference: any) => convertToPopulatedEntityReference(entity_reference)) : [],
    code_executions: data?.code_executions ? data.code_executions.map((code_execution: any) => convertToPopulatedCodeExecution(code_execution)) : [],
    tool_calls: data?.tool_calls ? data.tool_calls.map((tool_call: any) => convertToPopulatedToolCall(tool_call)) : [],
  };
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

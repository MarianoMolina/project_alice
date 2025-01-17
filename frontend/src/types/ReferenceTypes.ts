import Logger from "../utils/Logger";
import { ChatThread, convertToPopulatedChatThread, PopulatedChatThread } from "./ChatThreadTypes";
import { CodeExecution, convertToPopulatedCodeExecution, PopulatedCodeExecution } from "./CodeExecutionTypes";
import { convertToEmbeddingChunk, EmbeddingChunk } from "./EmbeddingChunkTypes";
import { convertToPopulatedEntityReference, EntityReference, PopulatedEntityReference } from "./EntityReferenceTypes";
import { convertToPopulatedFileReference, FileContentReference, FileReference, PopulatedFileReference } from "./FileTypes";
import { convertToPopulatedMessage, MessageType, PopulatedMessage } from "./MessageTypes";
import { convertToPopulatedTaskResponse, PopulatedTaskResponse, TaskResponse } from "./TaskResponseTypes";
import { convertToPopulatedToolCall, PopulatedToolCall, ToolCall } from "./ToolCallTypes";
import { convertToPopulatedUserInteraction, PopulatedUserInteraction, UserInteraction } from "./UserInteractionTypes";

export type ReferenceType =
  | MessageType | PopulatedMessage
  | FileReference | PopulatedFileReference
  | ChatThread | PopulatedChatThread
  | FileContentReference
  | TaskResponse | PopulatedTaskResponse
  | EntityReference | PopulatedEntityReference
  | UserInteraction | PopulatedUserInteraction
  | EmbeddingChunk
  | CodeExecution | PopulatedCodeExecution
  | ToolCall | PopulatedToolCall
  | string;

export enum OutputType {
  MESSAGE = "message",
  THREAD = "thread",
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
  threads?: string[];
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
  messages?: PopulatedMessage[];
  threads?: PopulatedChatThread[];
  files?: PopulatedFileReference[];
  task_responses?: PopulatedTaskResponse[];
  user_interactions?: PopulatedUserInteraction[];
  embeddings?: EmbeddingChunk[];
  entity_references?: PopulatedEntityReference[];
  code_executions?: PopulatedCodeExecution[];
  tool_calls?: PopulatedToolCall[];
}

// Create the populated interface
export interface PopulatedReferences extends Omit<References, keyof PopulatedFields>, PopulatedFields {}

export const convertToReferences = (data: any): References => {
  return {
    messages: data?.messages || [],
    threads: data?.threads || [],
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
    threads: data?.threads ? data.threads.map((thread: any) => convertToPopulatedChatThread(thread)) : [],
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
    (references.threads?.length ?? 0) > 0 ||
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
    (references.threads?.length ?? 0) +
    (references.files?.length ?? 0) +
    (references.task_responses?.length ?? 0) +
    (references.user_interactions?.length ?? 0) +
    (references.embeddings?.length ?? 0) +
    (references.entity_references?.length ?? 0) + 
    (references.code_executions?.length ?? 0) +
    (references.tool_calls?.length ?? 0)
  );
}

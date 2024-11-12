import { EmbeddingChunk } from "./EmbeddingChunkTypes";
import { FileContentReference, FileReference } from "./FileTypes";
import { MessageType } from "./MessageTypes";
import { TaskResponse } from "./TaskResponseTypes";
import { URLReference } from "./URLReferenceTypes";
import { UserInteraction } from "./UserInteractionTypes";

export type ReferenceType =
  | MessageType
  | FileReference
  | FileContentReference
  | TaskResponse
  | URLReference
  | UserInteraction
  | EmbeddingChunk
  | string;

export interface References {
  messages?: MessageType[];
  files?: (FileReference | FileContentReference)[];
  task_responses?: TaskResponse[];
  url_references?: URLReference[];
  user_interactions?: UserInteraction[];
  embeddings?: EmbeddingChunk[];
}

export function hasAnyReferences(references: References): boolean {
  return (
    (references.messages?.length ?? 0) > 0 ||
    (references.files?.length ?? 0) > 0 ||
    (references.task_responses?.length ?? 0) > 0 ||
    (references.url_references?.length ?? 0) > 0 ||
    (references.user_interactions?.length ?? 0) > 0 ||
    (references.embeddings?.length ?? 0) > 0
  );
}

export function howManyReferences(references: References): number {
  return (
    (references.messages?.length ?? 0) +
    (references.files?.length ?? 0) +
    (references.task_responses?.length ?? 0) +
    (references.url_references?.length ?? 0) +
    (references.user_interactions?.length ?? 0) +
    (references.embeddings?.length ?? 0)
  );
}

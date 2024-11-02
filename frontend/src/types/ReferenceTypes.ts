import { EmbeddingChunk } from "./EmbeddingChunkTypes";
import { FileContentReference, FileReference } from "./FileTypes";
import { MessageType } from "./MessageTypes";
import { TaskResponse } from "./TaskResponseTypes";
import { URLReference } from "./URLReferenceTypes";
import { UserInteraction } from "./UserInteractionTypes";

export interface References {
  messages?: MessageType[];
  files?: (FileReference | FileContentReference)[];
  task_responses?: TaskResponse[];
  url_references?: URLReference[];
  string_outputs?: string[];
  user_interactions?: UserInteraction[];
  embedding_chunks?: EmbeddingChunk[];
}

export function hasAnyReferences(references: References): boolean {
  return (
    (references.messages?.length ?? 0) > 0 ||
    (references.files?.length ?? 0) > 0 ||
    (references.task_responses?.length ?? 0) > 0 ||
    (references.url_references?.length ?? 0) > 0 ||
    (references.string_outputs?.length ?? 0) > 0 ||
    (references.user_interactions?.length ?? 0) > 0 ||
    (references.embedding_chunks?.length ?? 0) > 0
  );
}

export function howManyReferences(references: References): number {
  return (
    (references.messages?.length ?? 0) +
    (references.files?.length ?? 0) +
    (references.task_responses?.length ?? 0) +
    (references.url_references?.length ?? 0) +
    (references.string_outputs?.length ?? 0) +
    (references.user_interactions?.length ?? 0) +
    (references.embedding_chunks?.length ?? 0)
  );
}

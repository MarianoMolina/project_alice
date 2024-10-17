import { FileContentReference, FileReference } from "./FileTypes";
import { MessageType } from "./MessageTypes";
import { TaskResponse } from "./TaskResponseTypes";
import { URLReference } from "./URLReferenceTypes";

export interface References {
    messages?: MessageType[];
    files?: (FileReference | FileContentReference)[];
    task_responses?: TaskResponse[];
    url_references?: URLReference[];
    string_outputs?: string[];
}

export function hasAnyReferences(references: References): boolean {
    return (
      (references.messages?.length ?? 0) > 0 ||
      (references.files?.length ?? 0) > 0 ||
      (references.task_responses?.length ?? 0) > 0 ||
      (references.url_references?.length ?? 0) > 0 ||
      (references.string_outputs?.length ?? 0) > 0
    );
  }
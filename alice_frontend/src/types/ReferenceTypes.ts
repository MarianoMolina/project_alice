import { FileContentReference, FileReference } from "./FileTypes";
import { MessageType } from "./MessageTypes";
import { TaskResponse } from "./TaskResponseTypes";
import { URLReference } from "./URLReferenceTypes";

export interface References {
    messages?: MessageType[];
    files?: (FileReference | FileContentReference)[];
    task_responses?: TaskResponse[];
    search_results?: URLReference[];
    string_outputs?: string[];
}
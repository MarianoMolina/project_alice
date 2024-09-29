import { FileContentReference, FileReference } from "./FileTypes";
import { MessageType } from "./MessageTypes";
import { TaskResponse } from "./TaskResponseTypes";

interface SearchResult {
    id?: string;
    title: string;
    url: string;
    content: string;
    metadata: { [key: string]: string };
}

export interface References {
    messages?: MessageType[];
    files?: (FileReference | FileContentReference)[];
    task_responses?: TaskResponse[];
    search_results?: SearchResult[];
    string_outputs?: string[];
}
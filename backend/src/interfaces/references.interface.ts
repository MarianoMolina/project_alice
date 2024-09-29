import { Types } from "mongoose";
import { IFileReferenceDocument } from "./file.interface";
import { IMessageDocument } from "./message.interface";
import { ITaskResultDocument } from "./taskResult.interface";

interface SearchResult {
    id?: string;
    title: string;
    url: string;
    content: string;
    metadata: { [key: string]: string };
}

export interface References {
    messages?: Types.ObjectId[] | IMessageDocument[];
    files?: Types.ObjectId[] | IFileReferenceDocument[];
    task_responses?: Types.ObjectId[] | ITaskResultDocument[];
    search_results?: SearchResult[];
    string_outputs?: string[];
}
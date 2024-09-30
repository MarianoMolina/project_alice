import { Types } from "mongoose";
import { IFileReferenceDocument } from "./file.interface";
import { IMessageDocument } from "./message.interface";
import { ITaskResultDocument } from "./taskResult.interface";
import { IURLReference } from "./urlReference.interface";

export interface References {
    messages?: Types.ObjectId[] | IMessageDocument[];
    files?: Types.ObjectId[] | IFileReferenceDocument[];
    task_responses?: Types.ObjectId[] | ITaskResultDocument[];
    search_results?: Types.ObjectId[] | IURLReference[];
    string_outputs?: string[];
}
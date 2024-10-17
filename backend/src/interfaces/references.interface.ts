import { Types } from "mongoose";
import { IFileReferenceDocument } from "./file.interface";
import { IMessageDocument } from "./message.interface";
import { ITaskResultDocument } from "./taskResult.interface";
import { IURLReferenceDocument } from "./urlReference.interface";
import { IUserInteractionDocument } from "./userInteraction.interface";

export interface References {
    messages?: Types.ObjectId[] | IMessageDocument[];
    files?: Types.ObjectId[] | IFileReferenceDocument[];
    task_responses?: Types.ObjectId[] | ITaskResultDocument[];
    url_references?: Types.ObjectId[] | IURLReferenceDocument[];
    string_outputs?: string[];
    user_interactions?: Types.ObjectId[] | IUserInteractionDocument[];
}
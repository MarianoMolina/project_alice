import { Document, Model, Types } from "mongoose";

export interface IUserCheckpoint {
    user_prompt: string;
    options_obj: { [key: number]: string };
    task_next_obj: { [key: number]: string };
    request_feedback: boolean;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
}

export interface IUserCheckpointMethods {
    apiRepresentation(): any;
}

export interface IUserCheckpointDocument extends IUserCheckpoint, Document, IUserCheckpointMethods {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserCheckpointModel extends Model<IUserCheckpointDocument> {
    // Add any static methods here if needed
}
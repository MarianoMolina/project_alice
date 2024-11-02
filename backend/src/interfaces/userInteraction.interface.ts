import { Document, Model, Types } from "mongoose";
import { IUserDocument } from "./user.interface";
import { IUserCheckpointDocument } from "./userCheckpoint.interface";
import { ITaskResultDocument } from "./taskResult.interface";

export interface UserResponse {
    selected_option: number;
    user_feedback?: string;
}

export interface IUserInteraction {
    user_checkpoint_id: Types.ObjectId | IUserCheckpointDocument;
    task_response_id?: Types.ObjectId | ITaskResultDocument;
    user_response?: UserResponse;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface IUserInteractionMethods {
    apiRepresentation(): any;
}

export interface IUserInteractionDocument extends IUserInteraction, Document, IUserInteractionMethods {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserInteractionModel extends Model<IUserInteractionDocument> {
    // Add any static methods here if needed
}
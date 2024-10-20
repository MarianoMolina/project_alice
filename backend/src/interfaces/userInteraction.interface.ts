import { Document, Model, Types } from "mongoose";

export interface UserResponse {
    selected_option: number;
    user_feedback?: string;
}

export interface IUserInteraction {
    user_checkpoint_id: Types.ObjectId;
    task_response_id?: Types.ObjectId;
    user_response?: UserResponse;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
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
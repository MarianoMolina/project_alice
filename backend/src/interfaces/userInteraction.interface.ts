import { Document, Model, Types } from "mongoose";

export interface UserResponse {
    selected_option: number;
    user_feedback?: string;
}

export interface IUserInteraction {
    user_prompt: string;
    execution_history: { [key: string]: any };
    options_obj: { [key: number]: string };
    user_response?: UserResponse;
    task_next_obj: { [key: number]: string };
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
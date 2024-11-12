import { Document, Model, Types } from "mongoose";
import { IUserDocument } from "./user.interface";
import { IUserCheckpointDocument } from "./userCheckpoint.interface";
import { ITaskResultDocument } from "./taskResult.interface";
import { Embeddable } from "./embeddingChunk.interface";
import { IAliceChatDocument } from "./chat.interface";

// Enum for interaction owner types
export enum InteractionOwnerType {
    TASK_RESPONSE = "task_response",
    CHAT = "chat"
}

// Interface for the owner structure
export interface InteractionOwner {
    type: InteractionOwnerType;
    id: Types.ObjectId | ITaskResultDocument | IAliceChatDocument;
}

// User response interface (unchanged)
export interface UserResponse {
    selected_option: number;
    user_feedback?: string;
}

// Main user interaction interface
export interface IUserInteraction extends Embeddable {
    user_checkpoint_id: Types.ObjectId | IUserCheckpointDocument;
    owner: InteractionOwner;
    user_response?: UserResponse;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

// Methods interface (unchanged)
export interface IUserInteractionMethods {
    apiRepresentation(): any;
}

// Document interface
export interface IUserInteractionDocument extends IUserInteraction, Document, IUserInteractionMethods {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// Model interface (unchanged)
export interface IUserInteractionModel extends Model<IUserInteractionDocument> {
    // Add any static methods here if needed
}
import { Document, Model, Types } from "mongoose";
import { IUserDocument } from "./user.interface";
import { IUserCheckpointDocument } from "./userCheckpoint.interface";
import { ITaskResultDocument } from "./taskResult.interface";
import { Embeddable } from "./embeddingChunk.interface";
import { IAliceChatDocument } from "./chat.interface";
import { IChatThreadDocument } from "./thread.interface";

// Enum for interaction owner types
export enum InteractionOwnerType {
    TASK_RESPONSE = "task_response",
    CHAT = "chat"
}

// Base interface for owner properties
interface BaseOwner {
    type: InteractionOwnerType;
}

// Task response owner interface
interface TaskResponseOwner extends BaseOwner {
    type: InteractionOwnerType.TASK_RESPONSE;
    task_result_id: Types.ObjectId | ITaskResultDocument;
}

// Chat owner interface
interface ChatOwner extends BaseOwner {
    type: InteractionOwnerType.CHAT;
    chat_id: Types.ObjectId | IAliceChatDocument;
    thread_id: Types.ObjectId | IChatThreadDocument;
}

// Union type for all possible owners
export type InteractionOwner = TaskResponseOwner | ChatOwner;

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
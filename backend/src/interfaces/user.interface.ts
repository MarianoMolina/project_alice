import { Document, Model, Types } from 'mongoose';
import { IAgentDocument } from './agent.interface';
import { ITaskDocument } from './task.interface';
import { IDataClusterDocument } from './references.interface';
import { IUserCheckpointDocument } from './userCheckpoint.interface';

export type CreationMethod = 'password' | 'google';

export interface IUserDefaultChatConfig {
    alice_agent: Types.ObjectId | IAgentDocument;
    agent_tools: Types.ObjectId[] | ITaskDocument[];
    retrieval_tools: Types.ObjectId[] | ITaskDocument[];
    data_cluster?: Types.ObjectId | IDataClusterDocument;
    default_user_checkpoints: Map<string, Types.ObjectId | IUserCheckpointDocument>;
}

export enum UserTier {
    FREE = 'free',
    PRO = 'pro',
    ENTERPRISE = 'enterprise'
}

export interface IUserStats {
    user_tier: UserTier;
    log_in_attempts: number;
    last_log_in_attempt: Date | null;
    log_in_successes: number;
    last_log_in_success: Date | null;
    actions_taken: number;
}

// Update the IUser interface
export interface IUser {
    name: string;
    email: string;
    password?: string;
    role: 'user' | 'admin';
    creationMethod?: CreationMethod;
    default_chat_config?: IUserDefaultChatConfig;
    stats?: IUserStats;
}

export interface IUserMethods {
    apiRepresentation(): any;
}

export interface IUserDocument extends IUser, Document, IUserMethods {
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserModel extends Model<IUserDocument> {
    // Add any static methods here if needed
}
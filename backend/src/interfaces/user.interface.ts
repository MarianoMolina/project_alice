import { Document, Model, Types } from 'mongoose';
import { IAliceChat } from './chat.interface';
import { IAgentDocument } from './agent.interface';
import { ITaskDocument } from './task.interface';
import { IDataClusterDocument } from './references.interface';
import { IUserCheckpointDocument } from './userCheckpoint.interface';


export interface IUserDefaultChatConfig {
    alice_agent: Types.ObjectId | IAgentDocument;
    agent_tools: Types.ObjectId[] | ITaskDocument[];
    retrieval_tools: Types.ObjectId[] | ITaskDocument[];
    data_cluster?: Types.ObjectId | IDataClusterDocument;
    default_user_checkpoints: Map<string, Types.ObjectId | IUserCheckpointDocument>;
}

// Update the IUser interface
export interface IUser {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    default_chat_config?: IUserDefaultChatConfig;
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
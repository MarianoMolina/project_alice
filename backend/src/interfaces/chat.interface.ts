import { Model, Types, Document } from 'mongoose';
import { ITaskDocument } from './task.interface';
import { IAgentDocument } from './agent.interface';
import { IUserDocument } from './user.interface';
import { IUserCheckpointDocument } from './userCheckpoint.interface';
import { DataClusterHolder, IDataClusterDocument } from './references.interface';
import { IChatThreadDocument } from './thread.interface';

// ChangeHistory interfaces
export interface IChangeHistory {
    previous_agent: Types.ObjectId | null | IAgentDocument;
    updated_agent: Types.ObjectId | null | IAgentDocument;
    previous_agent_tools: Types.ObjectId[] | ITaskDocument[];
    updated_agent_tools: Types.ObjectId[] | ITaskDocument[];
    changed_by: Types.ObjectId | IUserDocument;
    timestamp: Date;
}

export interface IChangeHistoryDocument extends IChangeHistory, Document {
    apiRepresentation: () => any;
}

// AliceChat interfaces
export interface IAliceChat extends DataClusterHolder {
    name: string;
    threads?: Types.ObjectId[] | IChatThreadDocument[];
    changeHistory: IChangeHistoryDocument[];
    alice_agent: Types.ObjectId | IAgentDocument;
    agent_tools: Types.ObjectId[] | ITaskDocument[];
    retrieval_tools: Types.ObjectId[] | ITaskDocument[];
    data_cluster: Types.ObjectId | IDataClusterDocument;
    default_user_checkpoints: Map<string, Types.ObjectId | IUserCheckpointDocument>;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface IAliceChatMethods {
    apiRepresentation(): any;
}

export interface IAliceChatDocument extends IAliceChat, Document, IAliceChatMethods {
    _id: Types.ObjectId; 
    createdAt: Date;
    updatedAt: Date;
}

export interface IAliceChatModel extends Model<IAliceChatDocument> {
    // Add any static methods here if needed
}
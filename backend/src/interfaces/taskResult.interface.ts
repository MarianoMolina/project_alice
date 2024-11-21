import { Document, Types, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
import { References } from './references.interface';
import { Embeddable } from './embeddingChunk.interface';

export interface ExecutionHistoryItem {
    parent_task_id?: Types.ObjectId;
    node_name: string;
    execution_order: number;
    exit_code?: number;
}

export interface NodeResponse extends ExecutionHistoryItem {
    references?: References;
}

export interface ITaskResult extends Embeddable {
    task_name: string;
    task_id: Types.ObjectId;
    task_description: string;
    status: "pending" | "complete" | "failed";
    result_code: number;
    task_outputs: string | null;
    task_inputs: Map<string, any> | null;
    result_diagnostic: string | null;
    usage_metrics: Map<string, string> | null;
    execution_history?: ExecutionHistoryItem[];
    node_references?: NodeResponse[];
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface ITaskResultMethods {
    apiRepresentation(): any;
}

export interface ITaskResultDocument extends ITaskResult, Document, ITaskResultMethods {
    _id: Types.ObjectId; 
    createdAt: Date;
    updatedAt: Date;
}

export interface ITaskResultModel extends Model<ITaskResultDocument> {
    // Add any static methods here if needed
}
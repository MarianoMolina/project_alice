import { Document, Types, Model } from 'mongoose';

export interface ITaskResult {
    task_name: string;
    task_id: Types.ObjectId;
    task_description: string;
    status: "pending" | "complete" | "failed";
    result_code: number;
    task_outputs: string | null;
    task_inputs: Map<string, any> | null;
    result_diagnostic: string | null;
    usage_metrics: Map<string, string> | null;
    execution_history: Map<string, any>[];
    task_content: Map<string, any> | null;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
}

export interface ITaskResultMethods {
    apiRepresentation(): any;
}

export interface ITaskResultDocument extends ITaskResult, Document, ITaskResultMethods {
    createdAt: Date;
    updatedAt: Date;
}

export interface ITaskResultModel extends Model<ITaskResultDocument> {
    // Add any static methods here if needed
}
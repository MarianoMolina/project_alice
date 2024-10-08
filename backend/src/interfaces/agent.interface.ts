import { Model, Types, Document } from 'mongoose';
import { ModelType } from './model.interface';

export interface IAgent {
    name: string;
    system_message: Types.ObjectId | string;
    has_functions: boolean;
    has_code_exec: boolean;
    max_consecutive_auto_reply: number;
    models: Map<ModelType, Types.ObjectId>;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
}


export interface IAgentMethods {
    apiRepresentation(): any;
}

export interface IAgentDocument extends IAgent, Document, IAgentMethods {
    createdAt: Date;
    updatedAt: Date;
}

export interface IAgentModel extends Model<IAgentDocument> {
    // Add any static methods here if needed
}
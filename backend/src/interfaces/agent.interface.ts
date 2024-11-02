import { Model, Types, Document } from 'mongoose';
import { IModelDocument, ModelType } from './model.interface';
import { IUserDocument } from './user.interface';
import { IPromptDocument } from './prompt.interface';

export enum ToolPermission {
    DISABLED = 0,
    NORMAL = 1,
    WITH_PERMISSION = 2,
    DRY_RUN = 3
}

export enum CodePermission {
    DISABLED = 0,
    NORMAL = 1,
    WITH_PERMISSION = 2,
    TAGGED_ONLY = 3
}

export interface IAgent {
    name: string;
    system_message: Types.ObjectId | IPromptDocument;
    has_tools: ToolPermission;
    has_code_exec: CodePermission;
    max_consecutive_auto_reply: number;
    models: Map<ModelType, Types.ObjectId | IModelDocument>;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
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
import { Document, Types, Model } from 'mongoose';
import { IUserDocument } from './user.interface';
import { Embeddable } from './embeddingChunk.interface';

export interface CodeBlock {
    code: string;
    language: string;
}

export interface CodeOutput {
    output: string;
    exit_code: number;
}

export interface ICodeExecution extends Embeddable {
    code_block: CodeBlock;
    code_output: CodeOutput;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface ICodeExecutionMethods {
    apiRepresentation(): any;
}

export interface ICodeExecutionDocument extends ICodeExecution, Document, ICodeExecutionMethods {
    _id: Types.ObjectId; 
    createdAt: Date;
    updatedAt: Date;
}

export interface ICodeExecutionModel extends Model<ICodeExecutionDocument> {
    // Add any static methods here if needed
}
import mongoose, { CallbackWithoutResultAndOptionalError, Schema } from 'mongoose';
import { IDataClusterDocument, IDataClusterModel, References } from "../interfaces/references.interface";
import mongooseAutopopulate from 'mongoose-autopopulate';
import { getObjectId } from '../utils/utils';

export const referencesSchema = new Schema<References>({
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message', autopopulate: true }],
    files: [{ type: Schema.Types.ObjectId, ref: 'FileReference', autopopulate: true }],
    task_responses: [{ type: Schema.Types.ObjectId, ref: 'TaskResult', autopopulate: true }],
    url_references: [{ type: Schema.Types.ObjectId, ref: 'URLReference', autopopulate: true }],
    user_interactions: [{ type: Schema.Types.ObjectId, ref: 'UserInteraction', autopopulate: true }],
    embeddings: [{ type: Schema.Types.ObjectId, ref: 'EmbeddingChunk', autopopulate: true }],
    tool_calls: [{ type: Schema.Types.ObjectId, ref: 'ToolCall', autopopulate: true }],
    code_executions: [{ type: Schema.Types.ObjectId, ref: 'CodeExecution', autopopulate: true }],
});

function ensureObjectIdForSave(this: IDataClusterDocument, next: CallbackWithoutResultAndOptionalError) {
    if (this.messages) {
        this.messages = this.messages.map((obj) => getObjectId(obj));
    }
    if (this.files) {
        this.files = this.files.map((obj) => getObjectId(obj));
    }
    if (this.task_responses) {
        this.task_responses = this.task_responses.map((obj) => getObjectId(obj));
    }
    if (this.url_references) {
        this.url_references = this.url_references.map((obj) => getObjectId(obj));
    }
    if (this.user_interactions) {
        this.user_interactions = this.user_interactions.map((obj) => getObjectId(obj));
    }
    if (this.embeddings) {
        this.embeddings = this.embeddings.map((obj) => getObjectId(obj));
    }
    if (this.tool_calls) {
        this.tool_calls = this.tool_calls.map((obj) => getObjectId(obj));
    }
    if (this.code_executions) {
        this.code_executions = this.code_executions.map((obj) => getObjectId(obj));
    }
    next();
}

function ensureObjectIdForUpdate(
    this: mongoose.Query<any, any>,
    next: mongoose.CallbackWithoutResultAndOptionalError
  ) {
    const update = this.getUpdate() as any;
    if (update.messages) {
        update.messages = update.messages.map((obj: any) => getObjectId(obj));
    }
    if (update.files) {
        update.files = update.files.map((obj: any) => getObjectId(obj));
    }
    if (update.task_responses) {
        update.task_responses = update.task_responses.map((obj: any) => getObjectId(obj));
    }
    if (update.url_references) {
        update.url_references = update.url_references.map((obj: any) => getObjectId(obj));
    }
    if (update.user_interactions) {
        update.user_interactions = update.user_interactions.map((obj: any) => getObjectId(obj));
    }
    if (update.embeddings) {
        update.embeddings = update.embeddings.map((obj: any) => getObjectId(obj));
    }
    if (update.tool_calls) {
        update.tool_calls = update.tool_calls.map((obj: any) => getObjectId(obj));
    }
    if (update.code_executions) {
        update.code_executions = update.code_executions.map((obj: any) => getObjectId(obj));
    }
    next();
};

referencesSchema.plugin(mongooseAutopopulate);
referencesSchema.pre('save', ensureObjectIdForSave);
referencesSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
export const DataCluster = mongoose.model<IDataClusterDocument, IDataClusterModel>('DataCluster', referencesSchema);
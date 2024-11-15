import mongoose, { CallbackWithoutResultAndOptionalError, Schema } from 'mongoose';
import { IDataClusterDocument, IDataClusterModel, References } from "../interfaces/references.interface";
import mongooseAutopopulate from 'mongoose-autopopulate';
import { getObjectId } from '../utils/utils';

// Base references schema that can be embedded in other models
export const referencesSchema = new Schema<References>({
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message', autopopulate: true }],
    files: [{ type: Schema.Types.ObjectId, ref: 'FileReference', autopopulate: true }],
    task_responses: [{ type: Schema.Types.ObjectId, ref: 'TaskResult', autopopulate: true }],
    entity_references: [{ type: Schema.Types.ObjectId, ref: 'EntityReference', autopopulate: true }],
    user_interactions: [{ type: Schema.Types.ObjectId, ref: 'UserInteraction', autopopulate: true }],
    embeddings: [{ type: Schema.Types.ObjectId, ref: 'EmbeddingChunk', autopopulate: true }],
    tool_calls: [{ type: Schema.Types.ObjectId, ref: 'ToolCall', autopopulate: true }],
    code_executions: [{ type: Schema.Types.ObjectId, ref: 'CodeExecution', autopopulate: true }],
});

// Extended schema for DataCluster that includes document properties
const dataClusterSchema = new Schema<IDataClusterDocument, IDataClusterModel>({
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message', autopopulate: true }],
    files: [{ type: Schema.Types.ObjectId, ref: 'FileReference', autopopulate: true }],
    task_responses: [{ type: Schema.Types.ObjectId, ref: 'TaskResult', autopopulate: true }],
    entity_references: [{ type: Schema.Types.ObjectId, ref: 'EntityReference', autopopulate: true }],
    user_interactions: [{ type: Schema.Types.ObjectId, ref: 'UserInteraction', autopopulate: true }],
    embeddings: [{ type: Schema.Types.ObjectId, ref: 'EmbeddingChunk', autopopulate: true }],
    tool_calls: [{ type: Schema.Types.ObjectId, ref: 'ToolCall', autopopulate: true }],
    code_executions: [{ type: Schema.Types.ObjectId, ref: 'CodeExecution', autopopulate: true }],
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: true },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: true }
}, { timestamps: true });

// Add apiRepresentation method for DataCluster
dataClusterSchema.methods.apiRepresentation = function(this: IDataClusterDocument) {
    return {
        id: this._id,
        messages: this.messages || [],
        files: this.files || [],
        task_responses: this.task_responses || [],
        entity_references: this.entity_references || [],
        user_interactions: this.user_interactions || [],
        embeddings: this.embeddings || [],
        tool_calls: this.tool_calls || [],
        code_executions: this.code_executions || [],
        created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
        updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
        createdAt: this.createdAt || null,
        updatedAt: this.updatedAt || null
    };
};

// Handle ObjectId conversion for references in both schemas
function ensureObjectIdForSave(
    this: IDataClusterDocument,
    next: CallbackWithoutResultAndOptionalError
) {
    if (this.messages) this.messages = this.messages.map((obj) => getObjectId(obj));
    if (this.files) this.files = this.files.map((obj) => getObjectId(obj));
    if (this.task_responses) this.task_responses = this.task_responses.map((obj) => getObjectId(obj));
    if (this.entity_references) this.entity_references = this.entity_references.map((obj) => getObjectId(obj));
    if (this.user_interactions) this.user_interactions = this.user_interactions.map((obj) => getObjectId(obj));
    if (this.embeddings) this.embeddings = this.embeddings.map((obj) => getObjectId(obj));
    if (this.tool_calls) this.tool_calls = this.tool_calls.map((obj) => getObjectId(obj));
    if (this.code_executions) this.code_executions = this.code_executions.map((obj) => getObjectId(obj));
    if (this.created_by) this.created_by = getObjectId(this.created_by);
    if (this.updated_by) this.updated_by = getObjectId(this.updated_by);
    next();
}

function ensureObjectIdForUpdate(
    this: mongoose.Query<any, any>,
    next: CallbackWithoutResultAndOptionalError
) {
    const update = this.getUpdate() as any;
    if (update.messages) update.messages = update.messages.map((obj: any) => getObjectId(obj));
    if (update.files) update.files = update.files.map((obj: any) => getObjectId(obj));
    if (update.task_responses) update.task_responses = update.task_responses.map((obj: any) => getObjectId(obj));
    if (update.entity_references) update.entity_references = update.entity_references.map((obj: any) => getObjectId(obj));
    if (update.user_interactions) update.user_interactions = update.user_interactions.map((obj: any) => getObjectId(obj));
    if (update.embeddings) update.embeddings = update.embeddings.map((obj: any) => getObjectId(obj));
    if (update.tool_calls) update.tool_calls = update.tool_calls.map((obj: any) => getObjectId(obj));
    if (update.code_executions) update.code_executions = update.code_executions.map((obj: any) => getObjectId(obj));
    if (update.created_by) update.created_by = getObjectId(update.created_by);
    if (update.updated_by) update.updated_by = getObjectId(update.updated_by);
    next();
}

// Apply plugins and middleware to both schemas
referencesSchema.plugin(mongooseAutopopulate);
referencesSchema.pre('save', ensureObjectIdForSave);
referencesSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

dataClusterSchema.plugin(mongooseAutopopulate);
dataClusterSchema.pre('save', ensureObjectIdForSave);
dataClusterSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

export const DataCluster = mongoose.model<IDataClusterDocument, IDataClusterModel>('DataCluster', dataClusterSchema);
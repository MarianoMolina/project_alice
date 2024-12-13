import mongoose, { Schema } from 'mongoose';
import { IDataClusterDocument, IDataClusterModel, References } from "../interfaces/references.interface";
import mongooseAutopopulate from 'mongoose-autopopulate';
import { getObjectId, getObjectIdForList } from '../utils/utils';

// Base references schema that can be embedded in other models
export const referencesSchema = new Schema<References>({
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    files: [{ type: Schema.Types.ObjectId, ref: 'FileReference' }],
    task_responses: [{ type: Schema.Types.ObjectId, ref: 'TaskResult' }],
    entity_references: [{ type: Schema.Types.ObjectId, ref: 'EntityReference' }],
    user_interactions: [{ type: Schema.Types.ObjectId, ref: 'UserInteraction' }],
    embeddings: [{ type: Schema.Types.ObjectId, ref: 'EmbeddingChunk' }],
    tool_calls: [{ type: Schema.Types.ObjectId, ref: 'ToolCall' }],
    code_executions: [{ type: Schema.Types.ObjectId, ref: 'CodeExecution' }],
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

function ensureObjectIdForSave(
    this: IDataClusterDocument,
    next: mongoose.CallbackWithoutResultAndOptionalError
) {
    const context = { model: 'DataCluster', field: '' };
    if (this.messages) this.messages = getObjectIdForList(this.messages, { ...context, field: 'messages' });
    if (this.files) this.files = getObjectIdForList(this.files, { ...context, field: 'files' });
    if (this.task_responses) this.task_responses = getObjectIdForList(this.task_responses, { ...context, field: 'task_responses' });
    if (this.entity_references) this.entity_references = getObjectIdForList(this.entity_references, { ...context, field: 'entity_references' });
    if (this.user_interactions) this.user_interactions = getObjectIdForList(this.user_interactions, { ...context, field: 'user_interactions' });
    if (this.embeddings) this.embeddings = getObjectIdForList(this.embeddings, { ...context, field: 'embeddings' });
    if (this.tool_calls) this.tool_calls = getObjectIdForList(this.tool_calls, { ...context, field: 'tool_calls' });
    if (this.code_executions) this.code_executions = getObjectIdForList(this.code_executions, { ...context, field: 'code_executions' });
    
    if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
    if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
    next();
}

function ensureObjectIdForUpdate(
    this: mongoose.Query<any, any>,
    next: mongoose.CallbackWithoutResultAndOptionalError
) {
    const update = this.getUpdate() as any;
    if (!update) return next();
    const context = { model: 'DataCluster', field: '' };

    const arrayFields = [
        'messages', 'files', 'task_responses', 'entity_references',
        'user_interactions', 'embeddings', 'tool_calls', 'code_executions'
    ];

    arrayFields.forEach(field => {
        if (update[field]) update[field] = getObjectIdForList(update[field], { ...context, field });
    });

    if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
    if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
    next();
}

// Apply plugins and middleware
// referencesSchema.plugin(mongooseAutopopulate);
referencesSchema.pre('save', ensureObjectIdForSave);
referencesSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

dataClusterSchema.plugin(mongooseAutopopulate);
dataClusterSchema.pre('save', ensureObjectIdForSave);
dataClusterSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

export const DataCluster = mongoose.model<IDataClusterDocument, IDataClusterModel>('DataCluster', dataClusterSchema);
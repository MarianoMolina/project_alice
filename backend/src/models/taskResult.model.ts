import mongoose, { Schema } from 'mongoose';
import { ExecutionHistoryItem, ITaskResultDocument, ITaskResultModel, NodeResponse } from '../interfaces/taskResult.interface';
import { referencesSchema } from './reference.model';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { getObjectId, getObjectIdForList } from '../utils/utils';
import { EncryptionService } from '../utils/encrypt.utils';

// ExecutionHistoryItem and NodeResponse schemas remain the same
const executionHistoryItemSchema = new Schema<ExecutionHistoryItem>({
  parent_task_id: { type: Schema.Types.ObjectId, ref: 'Task' },
  node_name: { type: String, required: true },
  execution_order: { type: Number, required: true },
  exit_code: { type: Number }
});

const nodeResponseSchema = new Schema<NodeResponse>({
  parent_task_id: { type: Schema.Types.ObjectId, ref: 'Task' },
  node_name: { type: String, required: true },
  execution_order: { type: Number, required: true },
  exit_code: { type: Number },
  references: { type: referencesSchema, default: () => ({}) }
});

// Node middleware remains the same
function ensureObjectIdForSaveNode(
  this: NodeResponse,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  if (this.parent_task_id) this.parent_task_id = getObjectId(this.parent_task_id, { model: 'TaskResult', field: 'parent_task_id' });
  next();
}

function ensureObjectIdForUpdateNode(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  if (update.parent_task_id) update.parent_task_id = getObjectId(update.parent_task_id, { model: 'TaskResult', field: 'parent_task_id' });
  next();
}

executionHistoryItemSchema.pre('save', ensureObjectIdForSaveNode);
executionHistoryItemSchema.pre('findOneAndUpdate', ensureObjectIdForUpdateNode);
nodeResponseSchema.pre('save', ensureObjectIdForSaveNode);
nodeResponseSchema.pre('findOneAndUpdate', ensureObjectIdForUpdateNode);

// Updated TaskResult schema with encrypted task_outputs
const taskResultSchema = new Schema<ITaskResultDocument, ITaskResultModel>({
  task_name: { type: String, required: true },
  task_id: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  task_description: { type: String, required: true },
  status: { type: String, enum: ["pending", "complete", "failed"], required: true },
  result_code: { type: Number, required: true },
  task_outputs: { 
    type: String, 
    default: null,
    set: function(content: string) {
      if (!content) return content;
      try {
        return EncryptionService.getInstance().encrypt(content);
      } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt task outputs');
      }
    },
    get: function(encryptedContent: string) {
      if (!encryptedContent) return encryptedContent;
      try {
        return EncryptionService.getInstance().decrypt(encryptedContent);
      } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt task outputs');
      }
    }
  },
  task_inputs: { type: Map, of: Schema.Types.Mixed, default: null },
  result_diagnostic: { type: String, default: null },
  usage_metrics: { type: Map, of: Schema.Types.Mixed, default: null },
  execution_history: { type: [executionHistoryItemSchema], default: [] },
  node_references: { type: [nodeResponseSchema], default: [] },
  embedding: [{ type: Schema.Types.ObjectId, ref: 'EmbeddingChunk'}],
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true,
  toJSON: { getters: true },  // Ensure getters are called when converting to JSON
  toObject: { getters: true } // Ensure getters are called when converting to Object
});

taskResultSchema.methods.apiRepresentation = function(this: ITaskResultDocument) {
  return {
    id: this._id,
    task_name: this.task_name || null,
    task_id: this.task_id ? (this.task_id._id || this.task_id) : null,
    task_description: this.task_description || null,
    status: this.status || null,
    result_code: this.result_code || null,
    task_outputs: this.task_outputs || null,
    task_inputs: this.task_inputs || null,
    result_diagnostic: this.result_diagnostic || null,
    usage_metrics: this.usage_metrics || null,
    execution_history: this.execution_history || [],
    node_references: this.node_references || [],
    embedding: this.embedding || [],
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null
  };
};

function ensureObjectIdForSave(
  this: ITaskResultDocument,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const context = { model: 'TaskResult', field: '' };
  if (this.embedding) this.embedding = getObjectIdForList(this.embedding, { ...context, field: 'embedding' });
  if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
  if (this.task_id) this.task_id = getObjectId(this.task_id, { ...context, field: 'task_id' });
  next();
}

function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  const context = { model: 'TaskResult', field: '' };

  // Handle direct updates
  if (update.embedding) update.embedding = getObjectIdForList(update.embedding, { ...context, field: 'embedding' });
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
  if (update.task_id) update.task_id = getObjectId(update.task_id, { ...context, field: 'task_id' });
  if (update.task_outputs) {
    try {
      update.task_outputs = EncryptionService.getInstance().encrypt(update.task_outputs);
    } catch (error) {
      console.error('Encryption error during update:', error);
      throw new Error('Failed to encrypt task outputs during update');
    }
  }

  // Handle $set operations
  if (update.$set) {
    if (update.$set.embedding) update.$set.embedding = getObjectIdForList(update.$set.embedding, { ...context, field: 'embedding' });
    if (update.$set.created_by) update.$set.created_by = getObjectId(update.$set.created_by, { ...context, field: 'created_by' });
    if (update.$set.updated_by) update.$set.updated_by = getObjectId(update.$set.updated_by, { ...context, field: 'updated_by' });
    if (update.$set.task_id) update.$set.task_id = getObjectId(update.$set.task_id, { ...context, field: 'task_id' });
    if (update.$set.task_outputs) {
      try {
        update.$set.task_outputs = EncryptionService.getInstance().encrypt(update.$set.task_outputs);
      } catch (error) {
        console.error('Encryption error during $set update:', error);
        throw new Error('Failed to encrypt task outputs during $set update');
      }
    }
  }

  next();
}

taskResultSchema.plugin(mongooseAutopopulate);
taskResultSchema.pre('save', ensureObjectIdForSave);
taskResultSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

const TaskResult = mongoose.model<ITaskResultDocument, ITaskResultModel>('TaskResult', taskResultSchema);

export default TaskResult;
import mongoose, { Schema } from 'mongoose';
import { ExecutionHistoryItem, ITaskResultDocument, ITaskResultModel, NodeResponse } from '../interfaces/taskResult.interface';
import { referencesSchema } from './reference.model';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { getObjectId } from '../utils/utils';

// Create a schema for ExecutionHistoryItem
const executionHistoryItemSchema = new Schema<ExecutionHistoryItem>({
  parent_task_id: { type: String },
  node_name: { type: String, required: true },
  execution_order: { type: Number, required: true },
  exit_code: { type: Number }
});

// Create a schema for NodeResponse that extends ExecutionHistoryItem
const nodeResponseSchema = new Schema<NodeResponse>({
  parent_task_id: { type: String },
  node_name: { type: String, required: true },
  execution_order: { type: Number, required: true },
  exit_code: { type: Number },
  references: { type: referencesSchema, default: () => ({}) }
});

const taskResultSchema = new Schema<ITaskResultDocument, ITaskResultModel>({
  task_name: { type: String, required: true },
  task_id: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  task_description: { type: String, required: true },
  status: { type: String, enum: ["pending", "complete", "failed"], required: true },
  result_code: { type: Number, required: true },
  task_outputs: { type: String, default: null },
  task_inputs: { type: Map, of: Schema.Types.Mixed, default: null },
  result_diagnostic: { type: String, default: null },
  usage_metrics: { type: Map, of: String, default: null },
  execution_history: { type: [executionHistoryItemSchema], default: [] },
  node_references: { type: [nodeResponseSchema], default: [] },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true }
}, { timestamps: true });

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
  if (this.created_by) this.created_by = getObjectId(this.created_by);
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by);
  next();
}

function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (update.created_by) update.created_by = getObjectId(update.created_by);
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by);
  next();
}

taskResultSchema.plugin(mongooseAutopopulate);
taskResultSchema.pre('save', ensureObjectIdForSave);
taskResultSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

const TaskResult = mongoose.model<ITaskResultDocument, ITaskResultModel>('TaskResult', taskResultSchema);

export default TaskResult;
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { ITaskResultDocument } from '../interfaces/taskeresult.interface';

const taskResultSchema = new Schema<ITaskResultDocument>({
  task_name: { type: String, required: true },
  task_id: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  task_description: { type: String, required: true },
  status: { type: String, enum: ["pending", "complete", "failed"], required: true },
  result_code: { type: Number, required: true },
  task_outputs: { type: String, default: null },
  task_inputs: { type: Map, of: Schema.Types.Mixed, default: null },
  result_diagnostic: { type: String, default: null },
  usage_metrics: { type: Map, of: String, default: null },
  execution_history: [{ type: Map, of: Schema.Types.Mixed, default: null }],
  task_content: { type: Map, of: Schema.Types.Mixed, default: null },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
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
    task_content: this.task_content || null,
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null
  };
};

function ensureObjectIdForSave(this: ITaskResultDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.created_by && (this.created_by as any)._id) {
    this.created_by = (this.created_by as any)._id;
  }
  if (this.updated_by && (this.updated_by as any)._id) {
    this.updated_by = (this.updated_by as any)._id;
  }
  next();
}

function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (update.created_by && update.created_by._id) {
    update.created_by = update.created_by._id;
  }
  if (update.updated_by && update.updated_by._id) {
    update.updated_by = update.updated_by._id;
  }
  next();
}

function autoPopulate(this: mongoose.Query<any, any>) {
  this.populate('task_id created_by updated_by');
}

taskResultSchema.pre('save', ensureObjectIdForSave);
taskResultSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
taskResultSchema.pre('find', autoPopulate);
taskResultSchema.pre('findOne', autoPopulate);

const TaskResult = mongoose.model<ITaskResultDocument, Model<ITaskResultDocument>>('TaskResult', taskResultSchema);

export default TaskResult;
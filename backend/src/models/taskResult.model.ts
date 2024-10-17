import mongoose, { Schema } from 'mongoose';
import { ITaskResultDocument, ITaskResultModel } from '../interfaces/taskResult.interface';
import referencesSchema from './reference.model';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { ensureObjectIdHelper } from '../utils/utils';

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
  execution_history: [{ type: Map, of: Schema.Types.Mixed, default: null }],
  references: { type: referencesSchema, default: {}, description: "References associated with the task result" },
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
    references: this.references || null,
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
  if (this.references) {
    if (this.references.messages) {
      this.references.messages = this.references.messages.map(message => ensureObjectIdHelper(message));
    }
    if (this.references.files) {
      this.references.files = this.references.files.map(file => ensureObjectIdHelper(file));
    }
    if (this.references.task_responses) {
      this.references.task_responses = this.references.task_responses.map(taskResponse => ensureObjectIdHelper(taskResponse));
    }
    if (this.references.url_references) {
      this.references.url_references = this.references.url_references.map(searchResult => ensureObjectIdHelper(searchResult));
    }
  }
  this.created_by = ensureObjectIdHelper(this.created_by);
  this.updated_by = ensureObjectIdHelper(this.updated_by);
  next();
}

function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (update.references) {
    if (update.references.messages) {
      update.references.messages = update.references.messages.map((message: any) => ensureObjectIdHelper(message));
    }
    if (update.references.files) {
      update.references.files = update.references.files.map((file: any) => ensureObjectIdHelper(file));
    }
    if (update.references.task_responses) {
      update.references.task_responses = update.references.task_responses.map((taskResponse: any) => ensureObjectIdHelper(taskResponse));
    }
    if (update.references.url_references) {
      update.references.url_references = update.references.url_references.map((searchResult: any) => ensureObjectIdHelper(searchResult));
    }
  }
  update.created_by = ensureObjectIdHelper(update.created_by);
  update.updated_by = ensureObjectIdHelper(update.updated_by);
  next();
}

taskResultSchema.plugin(mongooseAutopopulate);
taskResultSchema.pre('save', ensureObjectIdForSave);
taskResultSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

const TaskResult = mongoose.model<ITaskResultDocument, ITaskResultModel>('TaskResult', taskResultSchema);

export default TaskResult;
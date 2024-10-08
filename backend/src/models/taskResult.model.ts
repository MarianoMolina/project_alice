import mongoose, { Schema } from 'mongoose';
import { ITaskResultDocument, ITaskResultModel } from '../interfaces/taskResult.interface';
<<<<<<< HEAD
=======
import referencesSchema from './reference.model';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { ensureObjectIdHelper } from '../utils/utils';
>>>>>>> development

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
<<<<<<< HEAD
  task_content: { type: Map, of: Schema.Types.Mixed, default: null },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
=======
  references: { type: referencesSchema, default: {}, description: "References associated with the task result" },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true }
>>>>>>> development
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
<<<<<<< HEAD
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
  this.populate('created_by updated_by'); // We don't populate task_id - its the only case and the goal is to avoid too much data
}

taskResultSchema.pre('save', ensureObjectIdForSave);
taskResultSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
taskResultSchema.pre('find', autoPopulate);
taskResultSchema.pre('findOne', autoPopulate);
=======
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
    if (this.references.search_results) {
      this.references.search_results = this.references.search_results.map(searchResult => ensureObjectIdHelper(searchResult));
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
    if (update.references.search_results) {
      update.references.search_results = update.references.search_results.map((searchResult: any) => ensureObjectIdHelper(searchResult));
    }
  }
  update.created_by = ensureObjectIdHelper(update.created_by);
  update.updated_by = ensureObjectIdHelper(update.updated_by);
  next();
}

taskResultSchema.plugin(mongooseAutopopulate);
taskResultSchema.pre('save', ensureObjectIdForSave);
taskResultSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
>>>>>>> development

const TaskResult = mongoose.model<ITaskResultDocument, ITaskResultModel>('TaskResult', taskResultSchema);

export default TaskResult;
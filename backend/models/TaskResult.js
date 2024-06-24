const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskResultSchema = new Schema({
  task_name: { type: String, required: true },
  task_id: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  task_description: { type: String, required: true },
  status: { type: String, enum: ["pending", "complete", "failed"], required: true },
  result_code: { type: Number, required: true },
  task_outputs: { type: Map, of: String, default: null, allowNull: true },
  task_inputs: { type: Map, of: String, default: null, allowNull: true},
  result_diagnostic: { type: String, default: null, allowNull: true },
  usage_metrics: { type: Map, of: String, default: null, allowNull: true },
  execution_history: [{ type: Map, of: String, default: null, allowNull: true }],
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

taskResultSchema.virtual('apiRepresentation').get(function() {
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
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null
  };
});

// Pre-save hook to ensure ObjectIds
function ensureObjectIdForSave(next) {
  // Convert created_by and updated_by to ObjectId if necessary
  if (this.created_by && this.created_by._id) {
    this.created_by = this.created_by._id;
  }
  if (this.updated_by && this.updated_by._id) {
    this.updated_by = this.updated_by._id;
  }
  next();
}

// Pre-update hook to ensure ObjectIds
function ensureObjectIdForUpdate(next) {
  if (this._update.created_by && this._update.created_by._id) {
    this._update.created_by = this._update.created_by._id;
  }
  if (this._update.updated_by && this._update.updated_by._id) {
    this._update.updated_by = this._update.updated_by._id;
  }
  next();
}

// Automatically populate references when finding documents
function autoPopulate() {
  this.populate('task_id created_by updated_by');
}

taskResultSchema.pre('save', ensureObjectIdForSave);
taskResultSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
taskResultSchema.pre('find', autoPopulate);
taskResultSchema.pre('findOne', autoPopulate);

const TaskResult = mongoose.model('TaskResult', taskResultSchema);
module.exports = TaskResult;

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { functionParametersSchema } = require('../utils/schemas');

const taskSchema = new Schema({
  task_name: { type: String, required: true, unique: true },
  task_description: { type: String, required: true },
  task_type: { type: String, enum: ["CVGenerationTask", "RedditSearchTask", "APITask", "WikipediaSearchTask", "GoogleSearchTask", "ExaSearchTask", "ArxivSearchTask", "BasicAgentTask", "PromptAgentTask", "CheckTask", "CodeGenerationLLMTask", "CodeExecutionLLMTask", "AgentWithFunctions"], required: true },
  input_variables: {
    type: functionParametersSchema,
    default: null,
    set: v => (v === undefined ? null : v)  // Custom setter to handle default null value
  },
  exit_codes: { type: Map, of: String, default: { 0: "Success", 1: "Failed" } },
  recursive: { type: Boolean, default: true },
  templates: { type: Map, of: String, default: {} },
  tasks: { type: Map, of: Schema.Types.ObjectId, ref: 'Task', default: {} },
  agent_name: { type: String, default: null, allowNull: true },
  valid_languages: [String],
  timeout: { type: Number, default: null, allowNull: true },
  prompts_to_add: { type: Map, of: Schema.Types.ObjectId, ref: 'Prompt', default: null },
  exit_code_response_map: { type: Map, of: Number, default: null },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

taskSchema.virtual('apiRepresentation').get(function() {
  return {
    id: this._id,
    task_name: this.task_name || null,
    task_description: this.task_description || null,
    task_type: this.task_type || null,
    input_variables: this.input_variables || null,
    exit_codes: this.exit_codes || {},
    recursive: this.recursive || false,
    templates: this.templates || {},
    tasks: this.tasks ? Object.fromEntries(
      Object.entries(this.tasks).map(([key, value]) => [key, value._id || value])
    ) : {},
    agent_name: this.agent_name || null,
    valid_languages: this.valid_languages || [],
    timeout: this.timeout || null,
    prompts_to_add: this.prompts_to_add ? Object.fromEntries(
      Object.entries(this.prompts_to_add).map(([key, value]) => [key, value._id || value])
    ) : null,
    exit_code_response_map: this.exit_code_response_map || null,
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null
  };
});

// Pre-save hook to ensure ObjectIds
function ensureObjectIdForSave(next) {
  // Convert tasks map entries to ObjectIds if necessary
  if (this.tasks) {
    for (const [key, value] of this.tasks.entries()) {
      if (value && value._id) {
        this.tasks.set(key, value._id);
      }
    }
  }
  // Convert prompts_to_add map entries to ObjectIds if necessary
  if (this.prompts_to_add) {
    for (const [key, value] of this.prompts_to_add.entries()) {
      if (value && value._id) {
        this.prompts_to_add.set(key, value._id);
      }
    }
  }

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
  if (this._update.tasks) {
    for (const [key, value] of Object.entries(this._update.tasks)) {
      if (value && value._id) {
        this._update.tasks[key] = value._id;
      }
    }
  }

  if (this._update.prompts_to_add) {
    for (const [key, value] of Object.entries(this._update.prompts_to_add)) {
      if (value && value._id) {
        this._update.prompts_to_add[key] = value._id;
      }
    }
  }

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
  this.populate('created_by updated_by tasks prompts_to_add' );
}

taskSchema.pre('save', ensureObjectIdForSave);
taskSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
taskSchema.pre('find', autoPopulate);
taskSchema.pre('findOne', autoPopulate);

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;

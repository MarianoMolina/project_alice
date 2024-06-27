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
    set: v => (v === undefined ? null : v)
  },
  exit_codes: { type: Map, of: String, default: { 0: "Success", 1: "Failed" } },
  recursive: { type: Boolean, default: true },
  templates: { type: Map, of: Schema.Types.ObjectId, ref: 'Prompt', default: null },
  tasks: { type: Map, of: Schema.Types.ObjectId, ref: 'Task', default: null },
  valid_languages: [String],
  timeout: { type: Number, default: null, allowNull: true },
  prompts_to_add: { type: Map, of: Schema.Types.ObjectId, ref: 'Prompt', default: null, allowNull: true },
  exit_code_response_map: { type: Map, of: Number, default: null, allowNull: true },
  start_task: { type: String, default: null, allowNull: true },
  task_selection_method: { type: Schema.Types.Mixed, default: null, allowNull: true },
  tasks_end_code_routing: { type: Map, of: Map, default: null, allowNull: true },
  max_attempts: { type: Number, default: 3 },
  recursive: { type: Boolean, default: false },
  agent_id: { type: Schema.Types.ObjectId, ref: 'Agent', default: null, allowNull: true },
  execution_agent_id: { type: Schema.Types.ObjectId, ref: 'Agent', default: null, allowNull: true },
  human_input: { type: Boolean, default: false },
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
    exit_codes: this.exit_codes ? Object.fromEntries(this.exit_codes) : {},
    recursive: this.recursive || false,
    templates: this.templates ? Object.fromEntries(this.templates) : null,
    tasks: this.tasks ? Object.fromEntries(this.tasks) : null,
    valid_languages: this.valid_languages || [],
    timeout: this.timeout || null,
    prompts_to_add: this.prompts_to_add ? Object.fromEntries(this.prompts_to_add) : null,
    exit_code_response_map: this.exit_code_response_map ? Object.fromEntries(this.exit_code_response_map) : null,
    start_task: this.start_task || null,
    task_selection_method: this.task_selection_method || null,
    tasks_end_code_routing: this.tasks_end_code_routing ? Object.fromEntries(
      Array.from(this.tasks_end_code_routing.entries()).map(([key, value]) => [key, Object.fromEntries(value)])
    ) : null,
    max_attempts: this.max_attempts || 3,
    agent_id: this.agent_id ? (this.agent_id._id || this.agent_id) : null,
    execution_agent_id: this.execution_agent_id ? (this.execution_agent_id._id || this.execution_agent_id) : null,
    human_input: this.human_input || false,
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null
  };
});

// Pre-save hook to ensure ObjectIds
function ensureObjectIdForSave(next) {
  if (this.templates) {
    for (const [key, value] of this.templates.entries()) {
      if (value && value._id) {
        this.templates.set(key, value._id);
      }
    }
  }
  if (this.tasks) {
    for (const [key, value] of this.tasks.entries()) {
      if (value && value._id) {
        this.tasks.set(key, value._id);
      }
    }
  }
  if (this.prompts_to_add) {
    for (const [key, value] of this.prompts_to_add.entries()) {
      if (value && value._id) {
        this.prompts_to_add.set(key, value._id);
      }
    }
  }
  if (this.agent_id && this.agent_id._id) {
    this.agent_id = this.agent_id._id;
  }
  if (this.execution_agent_id && this.execution_agent_id._id) {
    this.execution_agent_id = this.execution_agent_id._id;
  }
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
  if (this._update.templates) {
    for (const [key, value] of Object.entries(this._update.templates)) {
      if (value && value._id) {
        this._update.templates[key] = value._id;
      }
    }
  }
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
  if (this._update.agent_id && this._update.agent_id._id) {
    this._update.agent_id = this._update.agent_id._id;
  }
  if (this._update.execution_agent_id && this._update.execution_agent_id._id) {
    this._update.execution_agent_id = this._update.execution_agent_id._id;
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
function autoPopulate(next) {
  this.populate('created_by')
      .populate('updated_by')
      .populate('agent_id')
      .populate('execution_agent_id');
  
  // For Map fields, we need to use a different approach
  this.populate({
    path: 'templates',
    options: { strictPopulate: false }
  });
  this.populate({
    path: 'tasks',
    options: { strictPopulate: false }
  });
  this.populate({
    path: 'prompts_to_add',
    options: { strictPopulate: false }
  });

  next();
}

taskSchema.pre('save', ensureObjectIdForSave);
taskSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
taskSchema.pre('find', autoPopulate);
taskSchema.pre('findOne', autoPopulate);

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
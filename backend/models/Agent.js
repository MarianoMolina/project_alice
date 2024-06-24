const mongoose = require('mongoose');
const { Schema } = mongoose;

const agentSchema = new Schema({
  name: { type: String, required: true },
  system_message: { type: Schema.Types.ObjectId, ref: 'Prompt', default: '66732c3eba1560b00ad0a641' },
  functions: { type: Array, default: [] },
  functions_map: { type: Map, of: String, default: {} },
  agents_in_group: { type: Array, default: [] },
  autogen_class: { type: String, enum: ["ConversableAgent", "AssistantAgent", "UserProxyAgent", "GroupChatManager", "LLaVAAgent"], default: "ConversableAgent" },
  code_execution_config: { type: Boolean, default: false },
  max_consecutive_auto_reply: { type: Number, default: 10 },
  human_input_mode: { type: String, enum: ["ALWAYS", "TERMINATE", "NEVER"], default: "NEVER" },
  speaker_selection: { type: Map, of: String, default: {} },
  default_auto_reply: { type: String, default: null, allowNull: true },
  llm_config: { type: Map, of: String, default: {}},
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true
});

agentSchema.virtual('apiRepresentation').get(function() {
  return {
    id: this._id,
    name: this.name || null,
    system_message: this.system_message || null,
    functions: this.functions || [],
    functions_map: this.functions_map || {},
    agents_in_group: this.agents_in_group || [],
    autogen_class: this.autogen_class || "ConversableAgent",
    code_execution_config: this.code_execution_config || false,
    max_consecutive_auto_reply: this.max_consecutive_auto_reply || 10,
    human_input_mode: this.human_input_mode || "NEVER",
    speaker_selection: this.speaker_selection || {},
    default_auto_reply: this.default_auto_reply || null,
    llm_config: this.llm_config || {},
    created_by: this.created_by || null,
    updated_by: this.updated_by || null,
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null
  };
});

// Pre-save hook to ensure ObjectIds
function ensureObjectIdForSave(next) {
  console.log('ensureObjectIdForSave called');
  if (this.system_message && this.system_message._id) {
    this.system_message = this.system_message._id;
  }
  if (this.created_by && this.created_by._id) {
    this.created_by = this.created_by._id;
  }
  if (this.updated_by && this.updated_by._id) {
    this.updated_by = this.updated_by._id;
  }
  if (typeof next === 'function') {
    next();
  } else {
    throw new Error('Next is not a function');
  }
}

// Pre-update hook to ensure ObjectIds
function ensureObjectIdForUpdate(next) {
  console.log('ensureObjectIdForUpdate called');
  if (this._update.system_message && this._update.system_message._id) {
    this._update.system_message = this._update.system_message._id;
  }
  if (this._update.created_by && this._update.created_by._id) {
    this._update.created_by = this._update.created_by._id;
  }
  if (this._update.updated_by && this._update.updated_by._id) {
    this._update.updated_by = this._update.updated_by._id;
  }
  if (typeof next === 'function') {
    next();
  } else {
    throw new Error('Next is not a function');
  }
}
// Automatically populate references when finding documents
function autoPopulate() {
  this.populate('system_message updated_by created_by');
}

agentSchema.pre('save', ensureObjectIdForSave);
agentSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
agentSchema.pre('find', autoPopulate);
agentSchema.pre('findOne', autoPopulate);

const Agent = mongoose.model('Agent', agentSchema);
module.exports = Agent;

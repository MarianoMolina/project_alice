const mongoose = require('mongoose');
const { Schema } = mongoose;
const LOCAL_LLM_API_URL = process.env.LOCAL_LLM_API_URL || 'https://localhost:1234/v1';

const modelSchema = new Schema({
  short_name: { type: String, required: true, unique: true },
  model_name: { type: String, required: true },
  model_format: { type: String, required: true },
  ctx_size: { type: Number, required: true },
  model_type: { type: String, enum: ['instruct', 'chat', 'vision'], required: true },
  deployment: { type: String, enum: ['local', 'remote'], required: true },
  model_file: { type: String, default: null, allowNull: true },
  api_key: { type: String, default: 'lm-studio' },
  port: { type: Number, default: 1234 },
  api_type: { type: String, enum: ['openai', 'azure', 'anthropic'], default: 'openai' },
  base_url: { type: String, default: LOCAL_LLM_API_URL },
  autogen_model_client_cls: { type: String, default: null, allowNull: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true
});

modelSchema.virtual('apiRepresentation').get(function() {
  return {
    id: this._id,
    short_name: this.short_name || null,
    model_name: this.model_name || null,
    model_format: this.model_format || null,
    ctx_size: this.ctx_size || null,
    model_type: this.model_type || null,
    deployment: this.deployment || null,
    model_file: this.model_file || null,
    api_key: this.api_key || 'lm-studio',
    port: this.port || 1234,
    api_type: this.api_type || 'openai',
    base_url: this.base_url || LOCAL_LLM_API_URL,
    autogen_model_client_cls: this.autogen_model_client_cls || null,
    created_by: this.created_by || null,
    updated_by: this.updated_by || null,
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null
  };
});

// Function to convert populated object to ObjectId for save hook
function ensureObjectIdForSave(next) {
  if (this.created_by && this.created_by._id) {
    this.created_by = this.created_by._id;
  }
  if (this.updated_by && this.updated_by._id) {
    this.updated_by = this.updated_by._id;
  }
  next();
}

// Function to convert populated object to ObjectId for findOneAndUpdate hook
function ensureObjectIdForUpdate(next) {
  if (this._update.created_by && this._update.created_by._id) {
    this._update.created_by = this._update.created_by._id;
  }
  if (this._update.updated_by && this._update.updated_by._id) {
    this._update.updated_by = this._update.updated_by._id;
  }
  next();
}

modelSchema.pre('save', ensureObjectIdForSave);
modelSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

function autoPopulate() {
  this.populate('created_by updated_by');
}

modelSchema.pre('find', autoPopulate);
modelSchema.pre('findOne', autoPopulate);

const Model = mongoose.model('Model', modelSchema);

module.exports = Model;

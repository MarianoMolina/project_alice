const mongoose = require('mongoose');
const { Schema } = mongoose;
const { functionParametersSchema } = require('../utils/schemas');

const promptSchema = new Schema({
  name: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' },
  is_templated: { type: Boolean, default: false },
  parameters: { type: functionParametersSchema },
  partial_variables: { type: Map, of: Schema.Types.Mixed },
  version: { type: Number, default: 1 }
}, { timestamps: true });

// Function to convert populated object to ObjectId
function ensureObjectId(next) {
  if (this.created_by && this.created_by._id) {
    this.created_by = this.created_by._id;
  }
  if (this.updated_by && this.updated_by._id) {
    this.updated_by = this.updated_by._id;
  }
  next();
}

promptSchema.pre('save', ensureObjectId);
promptSchema.pre('findOneAndUpdate', function(next) {
  if (this._update.created_by && this._update.created_by._id) {
    this._update.created_by = this._update.created_by._id;
  }
  if (this._update.updated_by && this._update.updated_by._id) {
    this._update.updated_by = this._update.updated_by._id;
  }
  next();
});

function autoPopulate() {
  this.populate('created_by updated_by');
}
// Standardized virtual for API representation
promptSchema.virtual('apiRepresentation').get(function() {
  return {
    id: this._id,
    name: this.name || null,
    content: this.content || null,
    is_templated: this.is_templated || false,
    version: this.version || 1,
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null,
    parameters: this.is_templated ? (this.parameters || null) : null,
    partial_variables: this.is_templated ? (this.partial_variables || {}) : null,
    created_by: this.created_by || null,
    updated_by: this.updated_by || null
  };
});

promptSchema.pre('find', autoPopulate);
promptSchema.pre('findOne', autoPopulate);

const Prompt = mongoose.model('Prompt', promptSchema);
module.exports = Prompt;

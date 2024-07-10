import mongoose, { Schema, Model, CallbackWithoutResultAndOptionalError, Query } from 'mongoose';
import { functionParametersSchema, ensureObjectIdForProperties } from '../utils/schemas';
import { ensureObjectIdHelper } from '../utils/utils';
import { IPromptDocument } from '../interfaces/prompt.interface';

const promptSchema = new Schema<IPromptDocument>({
  name: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' },
  is_templated: { type: Boolean, default: false },
  parameters: { type: functionParametersSchema },
  partial_variables: { type: Map, of: Schema.Types.Mixed },
  version: { type: Number, default: 1 }
}, { timestamps: true });

promptSchema.methods.apiRepresentation = function(this: IPromptDocument) {
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
};

function ensureObjectId(this: IPromptDocument, next: CallbackWithoutResultAndOptionalError) {
  this.created_by = ensureObjectIdHelper(this.created_by);
  this.updated_by = ensureObjectIdHelper(this.updated_by);
  ensureObjectIdForProperties(this.parameters.properties);  
  next();
}

promptSchema.pre('save', ensureObjectId);

promptSchema.pre('findOneAndUpdate', function(next: CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (update && update.parameters && update.parameters.properties) {
    ensureObjectIdForProperties(update.parameters.properties);
  }
  next();
});

function autoPopulate(this: Query<any, any>, next: CallbackWithoutResultAndOptionalError) {
  this.populate('created_by updated_by parameters.properties');
  next();
}
promptSchema.pre('find', autoPopulate);
promptSchema.pre('findOne', autoPopulate);

const Prompt = mongoose.model<IPromptDocument, Model<IPromptDocument>>('Prompt', promptSchema);

export default Prompt;

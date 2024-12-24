import mongoose, { Schema } from 'mongoose';
import { functionParametersSchema } from './functionSchema';
import { ensureObjectIdForProperties, getObjectId } from '../utils/utils';
import { IPromptDocument, IPromptModel } from '../interfaces/prompt.interface';
import mongooseAutopopulate from 'mongoose-autopopulate';

const promptSchema = new Schema<IPromptDocument, IPromptModel>({
  name: { type: String, required: true },
  content: { type: String, required: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' },
  is_templated: { type: Boolean, default: false },
  parameters: {
    type: functionParametersSchema,
    required: false,
    description: "Parameters for the prompt",
    default: null
  },
  partial_variables: { type: Map, of: Schema.Types.Mixed },
  version: { type: Number, default: 1 }
}, { timestamps: true });

promptSchema.methods.apiRepresentation = function (this: IPromptDocument) {
  return {
    id: this._id,
    name: this.name || null,
    content: this.content || null,
    is_templated: this.is_templated || false,
    version: this.version || 1,
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null,
    parameters: this.is_templated ? (this.parameters || null) : null,
    partial_variables: this.is_templated ? (this.partial_variables || {}) : null,
    created_by: this.created_by || null,
    updated_by: this.updated_by || null
  };
};

function ensureObjectId(this: IPromptDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const context = { model: 'Prompt', field: '' };
  if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
  if (this.is_templated && this.parameters?.properties) {
    this.parameters.properties = ensureObjectIdForProperties(this.parameters.properties);
  }
  next();
}

function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  const context = { model: 'Prompt', field: '' };
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
  if (update.parameters?.properties) {
    update.parameters.properties = ensureObjectIdForProperties(update.parameters.properties);
  }
  next();
}

promptSchema.pre('save', ensureObjectId);
promptSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
promptSchema.plugin(mongooseAutopopulate);

const Prompt = mongoose.model<IPromptDocument, IPromptModel>('Prompt', promptSchema);

export default Prompt;
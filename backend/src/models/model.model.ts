import mongoose, { Schema, Model as MongooseModel } from 'mongoose';
import { IModel } from '../interfaces/model.interface';

const LOCAL_LLM_API_URL = process.env.LOCAL_LLM_API_URL || 'http://localhost:1234/v1';

const modelSchema = new Schema<IModel>({
  short_name: { type: String, required: true, unique: true },
  model: { type: String, required: true },
  model_format: { type: String, required: true },
  ctx_size: { type: Number, required: true },
  model_type: { type: String, enum: ['instruct', 'chat', 'vision'], required: true },
  deployment: { type: String, enum: ['local', 'remote'], required: true },
  model_file: { type: String, default: null },
  api_key: { type: String, default: 'lm-studio' },
  port: { type: Number, default: 1234 },
  api_type: { type: String, enum: ['openai', 'azure', 'anthropic'], default: 'openai' },
  base_url: { type: String, default: LOCAL_LLM_API_URL },
  autogen_model_client_cls: { type: String, default: null },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

modelSchema.virtual('apiRepresentation').get(function(this: IModel) {
  return {
    id: this._id,
    short_name: this.short_name || null,
    model: this.model || null,
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

function ensureObjectIdForSave(this: IModel, next: mongoose.CallbackWithoutResultAndOptionalError) {
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
  this.populate('created_by updated_by');
}

modelSchema.pre('save', ensureObjectIdForSave);
modelSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
modelSchema.pre('find', autoPopulate);
modelSchema.pre('findOne', autoPopulate);

const Model: MongooseModel<IModel> = mongoose.model<IModel>('Model', modelSchema);

export default Model;
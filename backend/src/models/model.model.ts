import mongoose, { Schema } from 'mongoose';
import { IModelDocument, IModelModel } from '../interfaces/model.interface';
import { ApiName } from '../interfaces/api.interface';

const modelSchema = new Schema<IModelDocument, IModelModel>({
  short_name: { type: String, required: true },
  model_name: { type: String, required: true },
  model_format: { type: String, required: true },
  ctx_size: { type: Number, required: true },
  model_type: { type: String, enum: ['instruct', 'chat', 'vision'], required: true },
  api_name: { type: String, default: ApiName.LM_STUDIO },
  temperature: { type: Number, default: 0.7 },
  seed: { type: Number, default: null },
  use_cache: { type: Boolean, default: false },
  lm_studio_preset: { type: String, default: 'OpenChat' },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

modelSchema.virtual('apiRepresentation').get(function(this: IModelDocument) {
  return {
    id: this._id,
    short_name: this.short_name || null,
    model_name: this.model_name || null,
    model_format: this.model_format || null,
    ctx_size: this.ctx_size || null,
    model_type: this.model_type || null,
    api_name: this.api_name || 'lm-studio',
    temperature: this.temperature || null,
    seed: this.seed || null,
    use_cache: this.use_cache || false,
    lm_studio_preset: this.lm_studio_preset || 'OpenChat',
    created_by: this.created_by || null,
    updated_by: this.updated_by || null,
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null
  };
});

function ensureObjectIdForSave(this: IModelDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
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

const Model = mongoose.model<IModelDocument, IModelModel>('Model', modelSchema);

export default Model;
import mongoose, { Schema } from 'mongoose';
import { IModelDocument, IModelModel, ModelType } from '../interfaces/model.interface';
import { ApiName } from '../interfaces/api.interface';
import { getObjectId } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';

const modelSchema = new Schema<IModelDocument, IModelModel>({
  short_name: { type: String, required: true },
  model_name: { type: String, required: true },
  model_format: { type: String, required: true },
  ctx_size: { type: Number, required: true },
  model_type: { type: String, enum: ModelType, required: true },
  api_name: { type: String, default: ApiName.LM_STUDIO },
  temperature: { type: Number, default: 0.7 },
  seed: { type: Number, default: null },
  use_cache: { type: Boolean, default: false },
  lm_studio_preset: { type: String, default: 'OpenChat' },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true }
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
    api_name: this.api_name || 'lm_studio',
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
  const context = { model: 'Model', field: '' };
  if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
  next();
}

function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  const context = { model: 'Model', field: '' };
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
  next();
}

modelSchema.pre('save', ensureObjectIdForSave);
modelSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
modelSchema.plugin(mongooseAutopopulate);

const Model = mongoose.model<IModelDocument, IModelModel>('Model', modelSchema);

export default Model;
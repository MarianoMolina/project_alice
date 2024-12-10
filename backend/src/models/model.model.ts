import mongoose, { Schema } from 'mongoose';
import { IModelConfig, IModelDocument, IModelModel, ModelType } from '../interfaces/model.interface';
import { ApiName } from '../interfaces/api.interface';
import { getObjectId } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';

const DEFAULT_MODEL_CONFIG: IModelConfig = {
  ctx_size: 4096, 
  temperature: 0.7,
  seed: null,
  use_cache: false,
  prompt_config: {
    bos: '<|im_start|>',
    eos: '<|im_end|>',
    system_role: 'system',
    user_role: 'user',
    assistant_role: 'assistant',
    tool_role: 'tool'
  }
};

const modelConfigSchema = new Schema<IModelConfig>({
  ctx_size: { type: Number, required: true },
  temperature: { type: Number, default: 0.7 },
  seed: { type: Number, default: null },
  use_cache: { type: Boolean, default: false },
  prompt_config: {
    bos: { type: String, required: true, default: '<|im_start|>' },
    eos: { type: String, required: true, default: '<|im_end|>' },
    system_role: { type: String, default: 'system' },
    user_role: { type: String, default: 'user' },
    assistant_role: { type: String, default: 'assistant' },
    tool_role: { type: String, default: 'tool' }
  }
});

const modelSchema = new Schema<IModelDocument, IModelModel>({
  short_name: { type: String, required: true },
  model_name: { type: String, required: true },
  config_obj: { 
    type: modelConfigSchema, 
    required: false, 
    default: () => ({ ...DEFAULT_MODEL_CONFIG }) 
  },  
  model_type: { type: String, enum: ModelType, required: true },
  api_name: { type: String, default: ApiName.LM_STUDIO },
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
    api_name: this.api_name || null,
    model_type: this.model_type || null,
    config_obj: this.config_obj || null,
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
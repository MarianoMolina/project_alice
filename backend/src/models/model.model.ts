import mongoose, { Schema } from 'mongoose';
import { IModelConfig, IModelDocument, IModelModel, ModelCosts, ModelType } from '../interfaces/model.interface';
import { ApiName } from '../interfaces/api.interface';
import { getObjectId } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';

const DEFAULT_MODEL_CONFIG: IModelConfig = {
  ctx_size: 4096, 
  temperature: 0.7,
  seed: null,
  use_cache: false,
  max_tokens_gen: 4096,
  prompt_config: {
    bos: '<|im_start|>',
    eos: '<|im_end|>',
    system_role: 'system',
    user_role: 'user',
    assistant_role: 'assistant',
    tool_role: 'tool'
  }
};

const DEFAULT_MODEL_COSTS: ModelCosts = {
  input_token_cost_per_million: 0.15,
  cached_input_token_cost_per_million: 0.075,
  output_token_cost_per_million: 0.6
};

const modelConfigSchema = new Schema<IModelConfig>({
  ctx_size: { type: Number, required: true },
  temperature: { type: Number, default: 0.7 },
  seed: { type: Number, default: null },
  use_cache: { type: Boolean, default: false },
  max_tokens_gen: { type: Number, default: 4096 },
  prompt_config: {
    bos: { type: String, required: true, default: '<|im_start|>' },
    eos: { type: String, required: true, default: '<|im_end|>' },
    system_role: { type: String, default: 'system' },
    user_role: { type: String, default: 'user' },
    assistant_role: { type: String, default: 'assistant' },
    tool_role: { type: String, default: 'tool' }
  }
});

const modelCostsSchema = new Schema<ModelCosts>({
  input_token_cost_per_million: { type: Number, required: true },
  cached_input_token_cost_per_million: { type: Number, required: true },
  output_token_cost_per_million: { type: Number, required: true },
  cost_per_unit: { type: Number, default: null }
});

const modelSchema = new Schema<IModelDocument, IModelModel>({
  short_name: { type: String, required: true },
  model_name: { type: String, required: true },
  config_obj: { 
    type: modelConfigSchema, 
    required: false, 
    default: () => ({ ...DEFAULT_MODEL_CONFIG }) 
  },  
  model_type: { type: String, enum: Object.values(ModelType), required: true },
  api_name: { type: String, enum: Object.values(ApiName), required: true },
  model_costs: { 
    type: modelCostsSchema, 
    required: false, 
    default: () => ({ ...DEFAULT_MODEL_COSTS }) 
  },
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
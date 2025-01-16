import mongoose, { Schema } from 'mongoose';
import { IAPIDocument, IAPIModel } from '../interfaces/api.interface';
import { getObjectId } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { ApiType } from '../utils/api.utils';

const apiSchema = new Schema<IAPIDocument, IAPIModel>({
  api_type: { type: String, enum: Object.values(ApiType), required: true },
  api_name: { type: String, required: true },
  name: { type: String, required: true },
  is_active: { type: Boolean, default: false },
  default_model: { type: Schema.Types.ObjectId, ref: 'Model', autopopulate: true  },
  api_config: { type:  Schema.Types.ObjectId, ref: 'APIConfig', autopopulate: true  },
  created_by: { type: Schema.Types.ObjectId, ref: 'User'  },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User'  }
}, { timestamps: true });

apiSchema.methods.apiRepresentation = function (this: IAPIDocument) {
  return {
    id: this._id,
    api_type: this.api_type || null,
    api_name: this.api_name || null,
    name: this.name || null,
    is_active: this.is_active || false,
    default_model: this.default_model || null,
    api_config: this.api_config || {},
    created_by: this.created_by || null,
    updated_by: this.updated_by || null,
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null
  };
}

function ensureObjectIdForSave(this: IAPIDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const context = { model: 'API', field: '' };
  if (this.api_config) this.api_config = getObjectId(this.api_config, { ...context, field: 'api_config' });
  if (this.default_model) this.default_model = getObjectId(this.default_model, { ...context, field: 'default_model' });
  if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'system_message' });
  next();
}
function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  const context = { model: 'API', field: '' };
  if (update.api_config) update.api_config = getObjectId(update.api_config, { ...context, field: 'api_config' });
  if (update.default_model) update.default_model = getObjectId(update.default_model, { ...context, field: 'default_model' });
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
  next();
}
apiSchema.pre('save', ensureObjectIdForSave);
apiSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
apiSchema.plugin(mongooseAutopopulate);
const API = mongoose.model<IAPIDocument, IAPIModel>('API', apiSchema);

export default API;
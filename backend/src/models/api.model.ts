import mongoose, { Schema } from 'mongoose';
import { ApiType, IAPIDocument, IAPIModel } from '../interfaces/api.interface';
import { getObjectId } from '../utils/utils';

const apiSchema = new Schema<IAPIDocument, IAPIModel>({
  api_type: { type: String, enum: Object.values(ApiType), required: true },
  api_name: { type: String, required: true },
  name: { type: String, required: true },
  is_active: { type: Boolean, default: false },
  health_status: { type: String, enum: ['healthy', 'unhealthy', 'unknown'], default: 'unknown' },
  default_model: { type: Schema.Types.ObjectId, ref: 'Model' },
  api_config: { type:  Schema.Types.ObjectId, ref: 'APIConfig' },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

apiSchema.methods.apiRepresentation = function (this: IAPIDocument) {
  return {
    id: this._id,
    api_type: this.api_type || null,
    api_name: this.api_name || null,
    name: this.name || null,
    is_active: this.is_active || false,
    health_status: this.health_status || 'unknown',
    default_model: this.default_model || null,
    api_config: this.api_config || {},
    created_by: this.created_by || null,
    updated_by: this.updated_by || null,
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null
  };
}

function ensureObjectIdForSave(this: IAPIDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.api_config) this.api_config = getObjectId(this.api_config);
  if (this.default_model) this.default_model = getObjectId(this.default_model);
  if (this.created_by) this.created_by = getObjectId(this.created_by);
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by);
  next();
}
function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (update.api_config) update.api_config = getObjectId(update.api_config);
  if (update.default_model) update.default_model = getObjectId(update.default_model);
  if (update.created_by) update.created_by = getObjectId(update.created_by);
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by);
  next();
}
function autoPopulate(this: mongoose.Query<any, any>) {
  this.populate('created_by updated_by default_model api_config');
}
apiSchema.pre('save', ensureObjectIdForSave);
apiSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
apiSchema.pre('find', autoPopulate);
apiSchema.pre('findOne', autoPopulate);

const API = mongoose.model<IAPIDocument, IAPIModel>('API', apiSchema);

export default API;
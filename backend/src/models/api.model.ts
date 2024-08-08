import mongoose, { Schema } from 'mongoose';
import { ApiType, IAPIDocument, IAPIModel } from '../interfaces/api.interface';

const apiSchema = new Schema<IAPIDocument, IAPIModel>({
  api_type: { type: String, enum: Object.values(ApiType), required: true },
  api_name: { type: String, required: true },
  name: { type: String, required: true },
  is_active: { type: Boolean, default: false },
  health_status: { type: String, enum: ['healthy', 'unhealthy', 'unknown'], default: 'unknown' },
  default_model: { type: Schema.Types.ObjectId, ref: 'Model' },
  api_config: { type: Map, of: String },
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
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null
  };
}

function ensureObjectIdForSave(this: IAPIDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.created_by && (this.created_by as any)._id) {
    this.created_by = (this.created_by as any)._id;
  }
  if (this.updated_by && (this.updated_by as any)._id) {
    this.updated_by = (this.updated_by as any)._id;
  }
  if (this.default_model && (this.default_model as any)._id) {
    this.default_model = (this.default_model as any)._id;
  }
  next();
}
function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (update.created_by && (update.created_by as any)._id) {
    update.created_by = (update.created_by as any)._id;
  }
  if (update.updated_by && (update.updated_by as any)._id) {
    update.updated_by = (update.updated_by as any)._id;
  }
  if (update.default_model && (update.default_model as any)._id) {
    update.default_model = (update.default_model as any)._id;
  }
  next();
}
function autoPopulate(this: mongoose.Query<any, any>) {
  this.populate('created_by updated_by default_model');
}
apiSchema.pre('save', ensureObjectIdForSave);
apiSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
apiSchema.pre('find', autoPopulate);
apiSchema.pre('findOne', autoPopulate);

const API = mongoose.model<IAPIDocument, IAPIModel>('API', apiSchema);

export default API;
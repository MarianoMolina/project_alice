import mongoose, { Schema } from 'mongoose';
import { IAPI, ApiType } from '../interfaces/api.interface';

const apiSchema = new Schema<IAPI>({
    api_type: { type: String, enum: Object.values(ApiType), required: true },
    name: { type: String, required: true },
    is_active: { type: Boolean, default: false },
    health_status: { type: String, enum: ['healthy', 'unhealthy', 'unknown'], default: 'unknown' },
    default_model: { type: Schema.Types.ObjectId, ref: 'Model' },
    api_config: { type: Map, of: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
  }, { timestamps: true });
  
  apiSchema.index({ created_by: 1, api_type: 1, name: 1 }, { unique: true });
  
  const API = mongoose.model<IAPI>('API', apiSchema);
  
  export default API;
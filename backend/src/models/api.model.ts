import mongoose, { Schema } from 'mongoose';
import { IAPI, ApiType } from '../interfaces/api.interface';

const apiSchema = new Schema<IAPI>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    api_type: { type: String, enum: Object.values(ApiType), required: true },
    name: { type: String, required: true },
    is_active: { type: Boolean, default: false },
    health_status: { type: String, enum: ['healthy', 'unhealthy', 'unknown'], default: 'unknown' },
    default_model: { type: Schema.Types.ObjectId, ref: 'Model' },
    api_config: { type: Map, of: Schema.Types.Mixed },
  }, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
  
  apiSchema.index({ user: 1, api_type: 1, name: 1 }, { unique: true });
  
  const API = mongoose.model<IAPI>('API', apiSchema);
  
  export default API;
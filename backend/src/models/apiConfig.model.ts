import mongoose, { Schema } from 'mongoose';
import { IAPIConfigDocument, IAPIConfigModel } from '../interfaces/apiConfig.interface';
import { getObjectId } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { ApiName, getApiConfigSchema, validateApiData } from '../utils/api.utils';
import { EncryptionService } from '../utils/encrypt.utils';
import Logger from '../utils/logger';

const apiConfigSchema = new Schema<IAPIConfigDocument, IAPIConfigModel>({
  name: {
    type: String,
    required: true,
    description: "Name of the API configuration"
  },
  api_name: {
    type: String,
    required: true,
    enum: Object.values(ApiName),
    description: "Name of the API"
  },
  data: {
    type: Schema.Types.Mixed,
    required: true,
    description: "Data of the API configuration",
    set: function(data: any) {
      if (!data) return data;
      const stringData = typeof data === 'string' ? data : JSON.stringify(data);
      return EncryptionService.getInstance().encrypt(stringData);
    },
    get: function(encryptedData: string) {
      if (!encryptedData) return encryptedData;
      const decrypted = EncryptionService.getInstance().decrypt(encryptedData);
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    }
  },
  health_status: { 
    type: String, 
    enum: ['healthy', 'unhealthy', 'unknown'], 
    default: 'unknown' 
  },
  created_by: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  updated_by: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, {
  timestamps: true,
  toJSON: { getters: true },  
  toObject: { getters: true }
});

// Pre-save middleware to validate data against api_name
apiConfigSchema.pre('save', function(next) {
  if (this.isModified('data')) {
    if (!validateApiData(this.data, this.api_name as ApiName)) {
      return next(new Error('Invalid data structure for API'));
    }
  }
  next();
});

function ensureObjectId(this: IAPIConfigDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const context = { model: 'APIConfig', field: '' };
  if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
  next();
}

function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  const context = { model: 'APIConfig', field: '' };
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
  next();
}

apiConfigSchema.statics.getConfigSchema = getApiConfigSchema;
apiConfigSchema.pre('save', ensureObjectId);
apiConfigSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
apiConfigSchema.plugin(mongooseAutopopulate);

apiConfigSchema.methods.validateConfig = function() {
  return validateApiData(this.data, this.api_name);
};

const APIConfig = mongoose.model<IAPIConfigDocument, IAPIConfigModel>('APIConfig', apiConfigSchema);
export default APIConfig;
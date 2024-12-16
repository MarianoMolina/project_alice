import mongoose, { Schema } from 'mongoose';
import { IAPIConfigDocument, IAPIConfigModel } from '../interfaces/apiConfig.interface';
import { getObjectId } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';

const apiConfigSchema = new Schema<IAPIConfigDocument, IAPIConfigModel>({
  name: { type: String, required: true, description: "Name of the API configuration" },
  api_name: { type: String, required: true, description: "Name of the API" },
  data: { type: Schema.Types.Mixed, required: true, description: "Data of the API configuration" },
  health_status: { type: String, enum: ['healthy', 'unhealthy', 'unknown'], default: 'unknown' },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

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

apiConfigSchema.pre('save', ensureObjectId);
apiConfigSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
apiConfigSchema.plugin(mongooseAutopopulate);

const APIConfig = mongoose.model<IAPIConfigDocument, IAPIConfigModel>('APIConfig', apiConfigSchema);

export default APIConfig;
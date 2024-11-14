import mongoose, { Schema } from 'mongoose';
import { IAPIConfigDocument, IAPIConfigModel } from '../interfaces/apiConfig.interface';

const apiConfigSchema = new Schema<IAPIConfigDocument, IAPIConfigModel>({
  name: { type: String, required: true, description: "Name of the API configuration" },
  api_name: { type: String, required: true, description: "Name of the API" },
  data: { type: Schema.Types.Mixed, required: true, description: "Data of the API configuration" },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

function ensureObjectId(this: IAPIConfigDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.created_by && (this.created_by as any)._id) {
    this.created_by = (this.created_by as any)._id;
  }
  if (this.updated_by && (this.updated_by as any)._id) {
    this.updated_by = (this.updated_by as any)._id;
  }
  next();
}
function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (update.created_by && update.created_by._id) {
    update.created_by = update.created_by._id;
  }
  if (update.updated_by && update.updated_by._id) {
    update.updated_by = update.updated_by._id;
  }
  next();
}
function autoPopulate(this: mongoose.Query<any, any>) {
  this.populate('created_by updated_by');
}
apiConfigSchema.pre('save', ensureObjectId);
apiConfigSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
apiConfigSchema.pre('find', autoPopulate);
apiConfigSchema.pre('findOne', autoPopulate);

const APIConfig = mongoose.model<IAPIConfigDocument, IAPIConfigModel>('APIConfig', apiConfigSchema);

export default APIConfig;
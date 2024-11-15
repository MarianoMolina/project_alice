import mongoose, { Schema } from 'mongoose';
import { IParameterDefinitionDocument, IParameterDefinitionModel } from '../interfaces/parameter.interface';
import { getObjectId } from '../utils/utils';

const parameterDefinitionSchema = new Schema<IParameterDefinitionDocument, IParameterDefinitionModel>({
  type: { type: String, required: true, description: "Type of the parameter, like string or integer" },
  description: { type: String, required: true, description: "Description of the parameter" },
  default: { type: Schema.Types.Mixed, default: null, description: "Default value of the parameter" },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

function ensureObjectId(this: IParameterDefinitionDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.created_by) this.created_by = getObjectId(this.created_by);
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by);
  next();
}
function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (update.created_by) update.created_by = getObjectId(update.created_by);
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by);
  next();
}
function autoPopulate(this: mongoose.Query<any, any>) {
  this.populate('created_by updated_by');
}
parameterDefinitionSchema.pre('save', ensureObjectId);
parameterDefinitionSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
parameterDefinitionSchema.pre('find', autoPopulate);
parameterDefinitionSchema.pre('findOne', autoPopulate);

const ParameterDefinition = mongoose.model<IParameterDefinitionDocument, IParameterDefinitionModel>('ParameterDefinition', parameterDefinitionSchema);

export default ParameterDefinition;
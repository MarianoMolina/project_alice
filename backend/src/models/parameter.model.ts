import mongoose, { Schema } from 'mongoose';
import { IParameterDefinitionDocument, IParameterDefinitionModel, ParameterTypes } from '../interfaces/parameter.interface';
import { getObjectId } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';

const parameterDefinitionSchema = new Schema<IParameterDefinitionDocument, IParameterDefinitionModel>({
  type: { 
    type: String, 
    enum: Object.values(ParameterTypes).filter(value => typeof value === 'string'), 
    required: true, description: "Type of the parameter, like string or integer" },
  description: { type: String, required: true, description: "Description of the parameter" },
  default: { type: Schema.Types.Mixed, default: null, description: "Default value of the parameter" },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

function ensureObjectId(this: IParameterDefinitionDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const context = { model: 'ParameterDefinition', field: '' };
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
  const context = { model: 'ParameterDefinition', field: '' };
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
  next();
}

parameterDefinitionSchema.pre('save', ensureObjectId);
parameterDefinitionSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
parameterDefinitionSchema.plugin(mongooseAutopopulate);

const ParameterDefinition = mongoose.model<IParameterDefinitionDocument, IParameterDefinitionModel>('ParameterDefinition', parameterDefinitionSchema);

export default ParameterDefinition;
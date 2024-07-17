import mongoose, { Schema } from 'mongoose';
import { IParameterDefinitionDocument, IParameterDefinitionModel } from '../interfaces/parameter.interface';

const parameterDefinitionSchema = new Schema<IParameterDefinitionDocument, IParameterDefinitionModel>({
  type: { type: String, required: true, description: "Type of the parameter, like string or integer" },
  description: { type: String, required: true, description: "Description of the parameter" },
  default: { type: Schema.Types.Mixed, default: null, description: "Default value of the parameter" },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

function ensureObjectId(this: IParameterDefinitionDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.created_by && (this.created_by as any)._id) {
    this.created_by = (this.created_by as any)._id;
  }
  if (this.updated_by && (this.updated_by as any)._id) {
    this.updated_by = (this.updated_by as any)._id;
  }
  next();
}

parameterDefinitionSchema.pre('save', ensureObjectId);
parameterDefinitionSchema.pre('findOneAndUpdate', function(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (update.created_by && update.created_by._id) {
    update.created_by = update.created_by._id;
  }
  if (update.updated_by && update.updated_by._id) {
    update.updated_by = update.updated_by._id;
  }
  next();
});

function autoPopulate(this: mongoose.Query<any, any>) {
  this.populate('created_by updated_by');
}

parameterDefinitionSchema.pre('find', autoPopulate);
parameterDefinitionSchema.pre('findOne', autoPopulate);

const ParameterDefinition = mongoose.model<IParameterDefinitionDocument, IParameterDefinitionModel>('ParameterDefinition', parameterDefinitionSchema);

export default ParameterDefinition;
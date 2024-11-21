import mongoose, { Schema, Types } from 'mongoose';
import { IParameterDefinitionDocument } from '../interfaces/parameter.interface';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { getObjectIdForMap } from '../utils/utils';

export interface IFunctionParameters {
  type: 'object';
  properties: Map<string, Types.ObjectId | IParameterDefinitionDocument>;
  required: string[];
}

export const functionParametersSchema = new Schema<IFunctionParameters>({
  type: {
    type: String,
    required: true,
    enum: ["object"],
    description: "Type of the parameters",
    default: "object"
  },
  properties: {
    type: Map,
    of: { type: Schema.Types.ObjectId, ref: 'ParameterDefinition' },
    required: true,
    autopopulate: true,
    description: "Dict of parameter names to their ParameterDefinition ObjectIds"
  },
  required: {
    type: [String],
    required: true,
    description: "Required parameters"
  }
}, { _id: false });

function ensureObjectId(this: IFunctionParameters, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const context = { model: 'functionParametersSchema', field: '' };
  if (this.properties) this.properties = getObjectIdForMap(this.properties, { ...context, field: 'properties' });
  next();
}

function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  const context = { model: 'functionParametersSchema', field: '' };
  if (update.properties) update.properties = getObjectIdForMap(update.properties, { ...context, field: 'properties' });
  next();
}

functionParametersSchema.plugin(mongooseAutopopulate);
functionParametersSchema.pre('save', ensureObjectId);
functionParametersSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
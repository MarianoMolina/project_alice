import { Schema, Types } from 'mongoose';

interface IFunctionParameters {
  type: 'object';
  properties: Map<string, { type: Types.ObjectId }>;
  required: string[];
}

const functionParametersSchema = new Schema<IFunctionParameters>({
  type: {
    type: String,
    required: true,
    enum: ["object"],
    description: "Type of the parameters",
    default: "object"
  },
  properties: {
    type: Map,
    of: new Schema({
      type: { type: Schema.Types.ObjectId, ref: 'ParameterDefinition' }
    }, { _id: false }),
    required: true,
    description: "Dict of parameters name to their type, description, and default value"
  },
  required: {
    type: [String],
    required: true,
    description: "Required parameters"
  }
}, { _id: false });

export { functionParametersSchema, IFunctionParameters };

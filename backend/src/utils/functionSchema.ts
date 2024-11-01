import { Schema, Types } from 'mongoose';

interface IFunctionParameters {
  type: 'object';
  properties: Map<string, Types.ObjectId>;
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
    of: { type: Schema.Types.ObjectId, ref: 'ParameterDefinition' },
    required: true,
    description: "Dict of parameter names to their ParameterDefinition ObjectIds"
  },
  required: {
    type: [String],
    required: true,
    description: "Required parameters"
  }
}, { _id: false });


export { functionParametersSchema, IFunctionParameters };

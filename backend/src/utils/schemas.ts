import { Schema, Types, Query } from 'mongoose';
import { ensureObjectIdHelper } from './utils';
import { ApiType } from '../interfaces/api.interface';

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

function ensureObjectIdForProperties(properties: Map<string, Types.ObjectId>) {
  if (properties instanceof Map) {
    for (const [key, value] of properties.entries()) {
      properties.set(key, ensureObjectIdHelper(value));
    }
  }
}


interface IAPIEngine {
  required_api: ApiType;
  input_variables: IFunctionParameters;
}

const apiEngineSchema = new Schema<IAPIEngine>({
  required_api: {
    type: String,
    required: true,
    enum: Object.values(ApiType),
    description: "Required API for the task"
  },
  input_variables: {
    type: functionParametersSchema,
    required: true,
    description: "Input variables for the API"
  }
}, { _id: false });

function ensureObjectIdForAPIEngine(apiEngine: IAPIEngine) {
  ensureObjectIdForProperties(apiEngine.input_variables.properties);
}

export { functionParametersSchema, IFunctionParameters, ensureObjectIdForProperties, apiEngineSchema, IAPIEngine, ensureObjectIdForAPIEngine };

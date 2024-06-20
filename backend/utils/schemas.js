const mongoose = require('mongoose');
const { Schema } = mongoose;

const parameterDefinitionSchema = new Schema({
    type: { type: String, required: true, description: "Type of the parameter" },
    description: { type: String, required: true, description: "Description of the parameter" },
    default: { type: Schema.Types.Mixed, description: "Default value of the parameter" } 
}, { _id: false });

const functionParametersSchema = new Schema({
    type: {
      type: String,
      required: true,
      enum: ["object"],
      description: "Type of the parameters",
      default: "object"
    },
    properties: {
      type: Map,
      of: parameterDefinitionSchema,
      required: true,
      description: "Dict of parameters name to their type, description, and default value"
    },
    required: {
      type: [String],
      required: true,
      description: "Required parameters"
    }
}, { _id: false });

module.exports = { functionParametersSchema, parameterDefinitionSchema };
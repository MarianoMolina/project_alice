import mongoose, { Schema, Types } from 'mongoose';

interface IFunctionParameters {
  type: 'object';
  properties: Map<string, { type: Types.ObjectId }>;
  required: string[];
}

// Helper function to convert to ObjectId
function convertToObjectId(v: any): any {
  if (v && typeof v === 'object' && '_id' in v) {
    return v._id;
  }
  if (mongoose.Types.ObjectId.isValid(v)) {
    return new mongoose.Types.ObjectId(v);
  }
  return v;
}

// Custom SchemaType for properties
const ObjectIdOrStringSchema = new Schema({
  type: {
    type: Schema.Types.Mixed,
    set: convertToObjectId
  }
}, { _id: false });

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
    of: ObjectIdOrStringSchema,
    required: true,
    description: "Dict of parameters name to their type, description, and default value"
  },
  required: {
    type: [String],
    required: true,
    description: "Required parameters"
  }
}, { _id: false });

// Middleware for save operations
functionParametersSchema.pre('save', function(next) {
  if (this.properties) {
    for (const [key, value] of this.properties.entries()) {
      if (value && typeof value === 'object' && 'type' in value) {
        value.type = convertToObjectId(value.type);
      }
    }
  }
  next();
});

// Middleware for update operations
functionParametersSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  if (update.properties) {
    for (const [key, value] of Object.entries(update.properties)) {
      if (value && typeof value === 'object' && 'type' in value) {
        (value as any).type = convertToObjectId((value as any).type);
      }
    }
  }
  next();
});

export { functionParametersSchema, IFunctionParameters };
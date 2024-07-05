import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import { functionParametersSchema } from '../utils/schemas';
import { IPromptDocument } from '../interfaces/prompt.interface';

const promptSchema = new Schema<IPromptDocument>({
  name: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' },
  is_templated: { type: Boolean, default: false },
  parameters: { type: functionParametersSchema },
  partial_variables: { type: Map, of: Schema.Types.Mixed },
  version: { type: Number, default: 1 }
}, { timestamps: true });

promptSchema.methods.apiRepresentation = function(this: IPromptDocument) {
  return {
    id: this._id,
    name: this.name || null,
    content: this.content || null,
    is_templated: this.is_templated || false,
    version: this.version || 1,
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null,
    parameters: this.is_templated ? (this.parameters || null) : null,
    partial_variables: this.is_templated ? (this.partial_variables || {}) : null,
    created_by: this.created_by || null,
    updated_by: this.updated_by || null
  };
};

function ensureObjectIdHelper(value: any): Types.ObjectId | any {
  if (value && typeof value === 'object' && '_id' in value) {
    return value._id;
  }
  return value;
}

function ensureObjectId(this: IPromptDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  this.created_by = ensureObjectIdHelper(this.created_by);
  this.updated_by = ensureObjectIdHelper(this.updated_by);

  if (this.parameters && this.parameters.properties) {
    for (const [key, value] of Object.entries(this.parameters.properties)) {
      if (value && typeof value === 'object' && 'type' in value) {
        (value as any).type = ensureObjectIdHelper((value as any).type);
      }
    }
  }
  next();
}

promptSchema.pre('save', ensureObjectId);

promptSchema.pre('findOneAndUpdate', function(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;

  update.created_by = ensureObjectIdHelper(update.created_by);
  update.updated_by = ensureObjectIdHelper(update.updated_by);

  if (update.parameters && update.parameters.properties) {
    update.parameters.properties = Object.fromEntries(
      Object.entries(update.parameters.properties).map(([key, value]) => {
        if (typeof value === 'object' && value !== null && 'type' in value) {
          return [key, { ...value, type: ensureObjectIdHelper((value as any).type) }];
        }
        return [key, value];
      })
    );
  }
 
  next();
});

function autoPopulate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  this.populate('created_by updated_by');
  next();
}

promptSchema.pre('find', autoPopulate);
promptSchema.pre('findOne', autoPopulate);

const Prompt = mongoose.model<IPromptDocument, Model<IPromptDocument>>('Prompt', promptSchema);

export default Prompt;
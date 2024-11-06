import mongoose, { Schema } from 'mongoose';
import { IAgentDocument, IAgentModel, ToolPermission, CodePermission } from '../interfaces/agent.interface';
import { getObjectId } from '../utils/utils';

const agentSchema = new Schema<IAgentDocument, IAgentModel>({
  name: { type: String, required: true },
  system_message: { type: Schema.Types.ObjectId, ref: 'Prompt' },
  max_consecutive_auto_reply: { type: Number, default: 10 },
  has_code_exec: { 
    type: Number, 
    enum: Object.values(CodePermission).filter(value => typeof value === 'number'),
    default: CodePermission.DISABLED 
  },
  has_tools: { 
    type: Number, 
    enum: Object.values(ToolPermission).filter(value => typeof value === 'number'),
    default: ToolPermission.DISABLED 
  },
  models: { type: Map, of: Schema.Types.ObjectId, ref: 'Model', default: {} },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

agentSchema.methods.apiRepresentation = function(this: IAgentDocument) {
  return {
    id: this._id,
    name: this.name || null,
    system_message: this.system_message || null,
    has_tools: this.has_tools || 0,
    has_code_exec: this.has_code_exec || 0,
    max_consecutive_auto_reply: this.max_consecutive_auto_reply || 10,
    models: this.models || {},
    created_by: this.created_by || null,
    updated_by: this.updated_by || null,
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null
  };
};

function ensureObjectIdForSave(this: IAgentDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.system_message && (this.system_message as any)._id) {
    this.system_message = (this.system_message as any)._id;
  }
  if (this.created_by && (this.created_by as any)._id) {
    this.created_by = (this.created_by as any)._id;
  }
  if (this.updated_by && (this.updated_by as any)._id) {
    this.updated_by = (this.updated_by as any)._id;
  }

  if (this.models) {
    for (const [key, value] of this.models.entries()) {
        this.models.set(key, getObjectId(value));
    }
}
  next();
}

function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (update.system_message && update.system_message._id) {
    update.system_message = update.system_message._id;
  }
  if (update.created_by && update.created_by._id) {
    update.created_by = update.created_by._id;
  }
  if (update.updated_by && update.updated_by._id) {
    update.updated_by = update.updated_by._id;
  }
  if (update.models) {
    update.models = Object.fromEntries(
        Object.entries(update.models).map(([key, value]) => [key, getObjectId(value)])
    );
}
  next();
}

function autoPopulate(this: mongoose.Query<any, any>) {
  this.populate('system_message updated_by created_by');
  this.populate({
    path: 'models',
    options: { strictPopulate: false }
});
}

agentSchema.pre('save', ensureObjectIdForSave);
agentSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
agentSchema.pre('find', autoPopulate);
agentSchema.pre('findOne', autoPopulate);

const Agent = mongoose.model<IAgentDocument, IAgentModel>('Agent', agentSchema);

export default Agent;
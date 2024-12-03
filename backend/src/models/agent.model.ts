import mongoose, { Schema } from 'mongoose';
import { IAgentDocument, IAgentModel, ToolPermission, CodePermission } from '../interfaces/agent.interface';
import { getObjectId, getObjectIdForMap } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';

const agentSchema = new Schema<IAgentDocument, IAgentModel>({
  name: { type: String, required: true },
  system_message: { type: Schema.Types.ObjectId, ref: 'Prompt', autopopulate: true },
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
  models: { 
    type: Map, 
    of: { type: Schema.Types.ObjectId, ref: 'Model', autopopulate: true },
    default: new Map()
  },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true }
}, {
  timestamps: true
});

agentSchema.methods.apiRepresentation = function() {
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

agentSchema.pre('save', function(next) {
  const context = { model: 'Agent', field: '' };
  if (this.system_message) this.system_message = getObjectId(this.system_message, { ...context, field: 'system_message' });
  if (this.models) this.models = getObjectIdForMap(this.models, { ...context, field: 'models' });
  if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
  next();
});

agentSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  const context = { model: 'Agent', field: '' };
  if (update.system_message) update.system_message = getObjectId(update.system_message, { ...context, field: 'system_message' })
  if (update.models) update.models = getObjectIdForMap(update.models, { ...context, field: 'models' })
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' })
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
  next();
});

agentSchema.plugin(mongooseAutopopulate);

const Agent = mongoose.model<IAgentDocument, IAgentModel>('Agent', agentSchema);

export default Agent;
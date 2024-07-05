import mongoose, { Schema, Document } from 'mongoose';
import { IAgent, AgentModel } from '../interfaces/agent.interface';

const agentSchema = new Schema<IAgent, AgentModel>({
  name: { type: String, required: true },
  system_message: { type: Schema.Types.ObjectId, ref: 'Prompt', default: '66732c3eba1560b00ad0a641' },
  functions: [Schema.Types.Mixed],
  functions_map: { type: Map, of: String, default: {} },
  agents_in_group: [Schema.Types.Mixed],
  autogen_class: { type: String, enum: ["ConversableAgent", "AssistantAgent", "UserProxyAgent", "GroupChatManager", "LLaVAAgent"], default: "ConversableAgent" },
  code_execution_config: { type: Boolean, default: false },
  max_consecutive_auto_reply: { type: Number, default: 10 },
  human_input_mode: { type: String, enum: ["ALWAYS", "TERMINATE", "NEVER"], default: "NEVER" },
  speaker_selection: { type: Map, of: String, default: {} },
  default_auto_reply: { type: String, default: null },
  llm_config: { type: Map, of: String, default: {} },
  modelId: { type: Schema.Types.ObjectId, ref: 'Model', default: null },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

agentSchema.methods.apiRepresentation = function(this: IAgent & Document) {
  return {
    id: this._id,
    name: this.name || null,
    system_message: this.system_message || null,
    functions: this.functions || [],
    functions_map: this.functions_map || {},
    agents_in_group: this.agents_in_group || [],
    autogen_class: this.autogen_class || "ConversableAgent",
    code_execution_config: this.code_execution_config || false,
    max_consecutive_auto_reply: this.max_consecutive_auto_reply || 10,
    human_input_mode: this.human_input_mode || "NEVER",
    speaker_selection: this.speaker_selection || {},
    default_auto_reply: this.default_auto_reply || null,
    llm_config: this.llm_config || {},
    modelId: this.modelId || null,
    created_by: this.created_by || null,
    updated_by: this.updated_by || null,
    created_at: (this as any).createdAt || null,
    updated_at: (this as any).updatedAt || null
  };
};

function ensureObjectIdForSave(this: IAgent & Document, next: mongoose.CallbackWithoutResultAndOptionalError) {
  console.log('ensureObjectIdForSave called');
  if (this.system_message && (this.system_message as any)._id) {
    this.system_message = (this.system_message as any)._id;
  }
  if (this.created_by && (this.created_by as any)._id) {
    this.created_by = (this.created_by as any)._id;
  }
  if (this.updated_by && (this.updated_by as any)._id) {
    this.updated_by = (this.updated_by as any)._id;
  }
  if (this.modelId && (this.modelId as any)._id) {
    this.modelId = (this.modelId as any)._id;
  }
  next();
}

function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  console.log('ensureObjectIdForUpdate called');
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
  if (update.modelId && update.modelId._id) {
    update.modelId = update.modelId._id;
  }
  next();
}

function autoPopulate(this: mongoose.Query<any, any>) {
  this.populate('system_message updated_by created_by modelId');
}

agentSchema.pre('save', ensureObjectIdForSave);
agentSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
agentSchema.pre('find', autoPopulate);
agentSchema.pre('findOne', autoPopulate);

const Agent = mongoose.model<IAgent, AgentModel>('Agent', agentSchema);

export default Agent;
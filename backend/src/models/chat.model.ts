import mongoose, { Schema } from 'mongoose';
import { IChangeHistoryDocument, IAliceChatDocument, IAliceChatModel } from '../interfaces/chat.interface';
import { getObjectId, getObjectIdForList, getObjectIdForMap } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';

// ChangeHistory schema
const changeHistorySchema = new Schema<IChangeHistoryDocument>({
  previous_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: false },
  updated_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: false },
  previous_agent_tools: [{ type: Schema.Types.ObjectId, ref: 'Task', required: false }],
  updated_agent_tools: [{ type: Schema.Types.ObjectId, ref: 'Task', required: false }],
  changed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
});

changeHistorySchema.methods.apiRepresentation = function (this: IChangeHistoryDocument) {
  return {
    id: this._id,
    previous_agent: this.previous_agent ? (this.previous_agent._id || this.previous_agent) : null,
    updated_agent: this.updated_agent ? (this.updated_agent._id || this.updated_agent) : null,
    previous_agent_tools: this.previous_agent_tools.map(func => func._id || func),
    updated_agent_tools: this.updated_agent_tools.map(func => func._id || func),
    changed_by: this.changed_by ? (this.changed_by._id || this.changed_by) : null,
    timestamp: this.timestamp || null
  };
};

// AliceChat schema
const aliceChatSchema = new Schema<IAliceChatDocument, IAliceChatModel>({
  name: { type: String, default: "New Chat", description: "Name of the chat" },
  messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
  changeHistory: [{ type: changeHistorySchema, default: [], description: "List of changes in the chat conversation" }],
  alice_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true, description: "The Alice agent object", autopopulate: true },
  agent_tools: [{
    type: Schema.Types.ObjectId,
    ref: 'Task',
    default: [],
    description: "List of tools to be registered with the agent",
    autopopulate: true
  }],
  retrieval_tools: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Task', 
    default: [], 
    description: "List of tools with access to the data cluster", 
    autopopulate: true 
  }],
  data_cluster: { 
    type: Schema.Types.ObjectId, 
    ref: 'DataCluster', 
    required: false, 
    description: "Data cluster for the chat", 
    autopopulate: true 
  },
  default_user_checkpoints: {
    type: Map,
    of: { type: Schema.Types.ObjectId, ref: 'UserCheckpoint', autopopulate: true },
    default: () => new Map(),
  },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true }
}, { timestamps: true });

aliceChatSchema.methods.apiRepresentation = function (this: IAliceChatDocument) {
  return {
    id: this._id,
    messages: this.messages.map((message) => message._id || message),
    changeHistory: this.changeHistory.map((change) => change.apiRepresentation()),
    alice_agent: this.alice_agent ? (this.alice_agent._id || this.alice_agent) : null,
    agent_tools: this.agent_tools.map((func) => func._id || func),
    retrieval_tools: this.retrieval_tools.map((func) => func._id || func),
    data_cluster: this.data_cluster ? (this.data_cluster._id || this.data_cluster) : null,
    default_user_checkpoints: this.default_user_checkpoints || {},
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null,
  };
};

function ensureObjectIdForSave(
  this: IAliceChatDocument,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const context = { model: 'AliceChat', field: '' };
  if (this.alice_agent) this.alice_agent = getObjectId(this.alice_agent, { ...context, field: 'alice_agent' });
  if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
  if (this.data_cluster) this.data_cluster = getObjectId(this.data_cluster, { ...context, field: 'data_cluster' });
  if (this.agent_tools) this.agent_tools = getObjectIdForList(this.agent_tools, { ...context, field: 'agent_tools' });
  if (this.retrieval_tools) this.retrieval_tools = getObjectIdForList(this.retrieval_tools, { ...context, field: 'retrieval_tools' });
  if (this.messages) this.messages = getObjectIdForList(this.messages, { ...context, field: 'messages' });
  if (this.default_user_checkpoints) {
    this.default_user_checkpoints = getObjectIdForMap(this.default_user_checkpoints, { ...context, field: 'default_user_checkpoints' });
  }
  next();
}

function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  const context = { model: 'AliceChat', field: '' };
  if (update.alice_agent) update.alice_agent = getObjectId(update.alice_agent, { ...context, field: 'alice_agent' });
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
  if (update.data_cluster) update.data_cluster = getObjectId(update.data_cluster, { ...context, field: 'data_cluster' });
  if (update.agent_tools) update.agent_tools = getObjectIdForList(update.agent_tools, { ...context, field: 'agent_tools' });
  if (update.retrieval_tools) update.retrieval_tools = getObjectIdForList(update.retrieval_tools, { ...context, field: 'retrieval_tools' });
  if (update.messages) update.messages = getObjectIdForList(update.messages, { ...context, field: 'messages' });
  if (update.default_user_checkpoints) {
    update.default_user_checkpoints = getObjectIdForMap(update.default_user_checkpoints, { ...context, field: 'default_user_checkpoints' });
  }
  next();
}

aliceChatSchema.pre('save', ensureObjectIdForSave);
aliceChatSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
aliceChatSchema.plugin(mongooseAutopopulate);

const AliceChat = mongoose.model<IAliceChatDocument, IAliceChatModel>('AliceChat', aliceChatSchema);

export default AliceChat;
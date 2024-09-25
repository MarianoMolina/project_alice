import mongoose, { Schema } from 'mongoose';
import { IChangeHistoryDocument, IAliceChatDocument, IAliceChatModel } from '../interfaces/chat.interface';
import { ensureObjectIdHelper } from '../utils/utils';

// ChangeHistory schema
const changeHistorySchema = new Schema<IChangeHistoryDocument>({
  previous_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: false },
  updated_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: false },
  previous_functions: [{ type: Schema.Types.ObjectId, ref: 'Task', required: false }],
  updated_functions: [{ type: Schema.Types.ObjectId, ref: 'Task', required: false }],
  changed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
});

changeHistorySchema.methods.apiRepresentation = function (this: IChangeHistoryDocument) {
  return {
    id: this._id,
    previous_agent: this.previous_agent ? (this.previous_agent._id || this.previous_agent) : null,
    updated_agent: this.updated_agent ? (this.updated_agent._id || this.updated_agent) : null,
    previous_functions: this.previous_functions.map(func => func._id || func),
    updated_functions: this.updated_functions.map(func => func._id || func),
    changed_by: this.changed_by ? (this.changed_by._id || this.changed_by) : null,
    timestamp: this.timestamp || null
  };
};

// AliceChat schema
const aliceChatSchema = new Schema<IAliceChatDocument, IAliceChatModel>({
  name: { type: String, default: "New Chat", description: "Name of the chat" },
  messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }], 
  changeHistory: [{ type: changeHistorySchema, default: [], description: "List of changes in the chat conversation" }],
  alice_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true, description: "The Alice agent object" },
  functions: [{ type: Schema.Types.ObjectId, ref: 'Task', default: [], description: "List of functions to be registered with the agent" }],
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

aliceChatSchema.methods.apiRepresentation = function (this: IAliceChatDocument) {
  return {
    id: this._id,
    messages: this.messages.map((message) => message.apiRepresentation()),
    changeHistory: this.changeHistory.map((change) => change.apiRepresentation()),
    alice_agent: this.alice_agent ? (this.alice_agent._id || this.alice_agent) : null,
    functions: this.functions.map((func) => func._id || func),
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
  if (this.alice_agent) this.alice_agent = ensureObjectIdHelper(this.alice_agent);
  if (this.created_by) this.created_by = ensureObjectIdHelper(this.created_by);
  if (this.updated_by) this.updated_by = ensureObjectIdHelper(this.updated_by);
  if (this.functions) {
    this.functions = this.functions.map((func) => ensureObjectIdHelper(func));
  }
  if (this.messages) {
    this.messages = this.messages.map((message) => ensureObjectIdHelper(message));
  }
  next();
}

function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (update.alice_agent) update.alice_agent = ensureObjectIdHelper(update.alice_agent);
  if (update.created_by) update.created_by = ensureObjectIdHelper(update.created_by);
  if (update.updated_by) update.updated_by = ensureObjectIdHelper(update.updated_by);
  if (update.functions) {
    update.functions = update.functions.map((func: any) => ensureObjectIdHelper(func));
  }
  if (update.messages) {
    update.messages = update.messages.map((message: any) => ensureObjectIdHelper(message));
  }
  next();
}

function autoPopulate(this: mongoose.Query<any, any>) {
  this.populate('alice_agent created_by updated_by')
    .populate('functions')
    .populate('messages'); // Only need to populate messages at the top level
}

aliceChatSchema.pre('save', ensureObjectIdForSave);
aliceChatSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
aliceChatSchema.pre('find', autoPopulate);
aliceChatSchema.pre('findOne', autoPopulate);

const AliceChat = mongoose.model<IAliceChatDocument, IAliceChatModel>('AliceChat', aliceChatSchema);

export default AliceChat;
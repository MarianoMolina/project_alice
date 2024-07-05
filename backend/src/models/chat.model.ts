import mongoose, { Schema, Model } from 'mongoose';
import { IChangeHistoryDocument, IMessageDocument, IAliceChatDocument } from '../interfaces/chat.interface';

// ChangeHistory schema
const changeHistorySchema = new Schema<IChangeHistoryDocument>({
  previous_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: false },
  updated_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: false },
  previous_executor: { type: Schema.Types.ObjectId, ref: 'Agent', required: false },
  updated_executor: { type: Schema.Types.ObjectId, ref: 'Agent', required: false },
  previous_functions: [{ type: Schema.Types.ObjectId, ref: 'Task', required: false }],
  updated_functions: [{ type: Schema.Types.ObjectId, ref: 'Task', required: false }],
  previous_task_responses: [{ type: Schema.Types.ObjectId, ref: 'TaskResult', required: false }],
  updated_task_responses: [{ type: Schema.Types.ObjectId, ref: 'TaskResult', required: false }],
  previous_llm_config: { type: Schema.Types.Mixed, required: false },
  updated_llm_config: { type: Schema.Types.Mixed, required: false },
  changed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
});

changeHistorySchema.methods.apiRepresentation = function(this: IChangeHistoryDocument) {
  return {
    id: this._id,
    previous_agent: this.previous_agent ? (this.previous_agent._id || this.previous_agent) : null,
    updated_agent: this.updated_agent ? (this.updated_agent._id || this.updated_agent) : null,
    previous_executor: this.previous_executor ? (this.previous_executor._id || this.previous_executor) : null,
    updated_executor: this.updated_executor ? (this.updated_executor._id || this.updated_executor) : null,
    previous_functions: this.previous_functions.map(func => func._id || func),
    updated_functions: this.updated_functions.map(func => func._id || func),
    previous_task_responses: this.previous_task_responses.map(task => task._id || task),
    updated_task_responses: this.updated_task_responses.map(task => task._id || task),
    previous_llm_config: this.previous_llm_config || {},
    updated_llm_config: this.updated_llm_config || {},
    changed_by: this.changed_by ? (this.changed_by._id || this.changed_by) : null,
    timestamp: this.timestamp || null
  };
};

// Message schema
const messageSchema = new Schema<IMessageDocument>({
  content: { type: String, required: true, description: "Content of the message" },
  role: { type: String, enum: ["user", "assistant", "system", "tool"], default: "user", description: "Role of the message" },
  generated_by: { type: String, enum: ["user", "llm", "tool"], default: "user", description: "Source that generated the message" },
  step: { type: String, default: "", description: "Process that is creating this message, usually the task_name or tool_name" },
  assistant_name: { type: String, default: "", description: "Name of the assistant" },
  context: { type: Schema.Types.Mixed, default: null, description: "Context of the message" },
  type: { type: String, default: "text", description: "Type of the message" },
  request_type: { type: String, default: null, description: "Request type of the message, if any. Can be 'approval', 'confirmation', etc." },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', description: "User ID used to call the endpoint" },
  task_responses: [{ type: Schema.Types.ObjectId, ref: 'TaskResult' }],
}, { timestamps: true });

messageSchema.methods.apiRepresentation = function(this: IMessageDocument) {
  return {
    id: this._id,
    content: this.content || null,
    role: this.role || "user",
    generated_by: this.generated_by || "user",
    step: this.step || "",
    assistant_name: this.assistant_name || "",
    context: this.context || null,
    type: this.type || "text",
    request_type: this.request_type || null,
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null,
    task_responses: this.task_responses || []
  };
};

// AliceChat schema
const aliceChatSchema = new Schema<IAliceChatDocument>({
  name: { type: String, default: "New Chat", description: "Name of the chat" },
  messages: [{ type: messageSchema, required: true, default: [], description: "List of messages in the chat conversation" }],
  changeHistory: [{ type: changeHistorySchema, default: [], description: "List of changes in the chat conversation" }],
  alice_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true, description: "The Alice agent object" },
  functions: [{ type: Schema.Types.ObjectId, ref: 'Task', default: [], description: "List of functions to be registered with the agent" }],
  executor: { type: Schema.Types.ObjectId, ref: 'Agent', required: true, description: "The executor agent object" },
  llm_config: { type: Schema.Types.Mixed, description: "The configuration for the LLM agent", default: {} },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

aliceChatSchema.methods.apiRepresentation = function(this: IAliceChatDocument) {
  return {
    id: this._id,
    messages: this.messages.map(message => message.apiRepresentation()),
    changeHistory: this.changeHistory.map(change => change.apiRepresentation()),
    alice_agent: this.alice_agent ? (this.alice_agent._id || this.alice_agent) : null,
    functions: this.functions.map(func => func._id || func),
    executor: this.executor ? (this.executor._id || this.executor) : null,
    llm_config: this.llm_config || {},
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null
  };
};

// Middleware functions
function ensureObjectIdForSave(this: IAliceChatDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.alice_agent && (this.alice_agent as any)._id) {
    this.alice_agent = (this.alice_agent as any)._id;
  }
  if (this.executor && (this.executor as any)._id) {
    this.executor = (this.executor as any)._id;
  }
  if (this.created_by && (this.created_by as any)._id) {
    this.created_by = (this.created_by as any)._id;
  }
  if (this.updated_by && (this.updated_by as any)._id) {
    this.updated_by = (this.updated_by as any)._id;
  }
  next();
}

function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (update.alice_agent && update.alice_agent._id) {
    update.alice_agent = update.alice_agent._id;
  }
  if (update.executor && update.executor._id) {
    update.executor = update.executor._id;
  }
  if (update.created_by && update.created_by._id) {
    update.created_by = update.created_by._id;
  }
  if (update.updated_by && update.updated_by._id) {
    update.updated_by = update.updated_by._id;
  }
  next();
}

function autoPopulate(this: mongoose.Query<any, any>) {
  this.populate('alice_agent executor created_by updated_by functions');
}

aliceChatSchema.pre('save', ensureObjectIdForSave);
aliceChatSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
aliceChatSchema.pre('find', autoPopulate);
aliceChatSchema.pre('findOne', autoPopulate);

const AliceChat = mongoose.model<IAliceChatDocument, Model<IAliceChatDocument>>('AliceChat', aliceChatSchema);

export default AliceChat;
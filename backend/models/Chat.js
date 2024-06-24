const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
  content: { type: String, required: true, description: "Content of the message" },
  role: { type: String, enum: ["user", "assistant", "system", "tool"], default: "user", description: "Role of the message" },
  generated_by: { type: String, enum: ["user", "llm", "tool"], default: "user", description: "Source that generated the message" },
  step: { type: String, default: "", description: "Process that is creating this message, usually the task_name or tool_name" },
  assistant_name: { type: String, default: "", description: "Name of the assistant" },
  context: { type: Schema.Types.Mixed, default: null, description: "Context of the message" },
  type: { type: String, default: "text", description: "Type of the message" },
  request_type: { type: String, default: null, description: "Request type of the message, if any. Can be 'approval', 'confirmation', etc." },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', description: "User ID used to call the endpoint" },
}, { timestamps: true });

messageSchema.virtual('apiRepresentation').get(function() {
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
    updated_at: this.updatedAt || null
  };
});

const aliceChatSchema = new Schema({
  messages: [{ type: messageSchema, required: true, default: [], description: "List of messages in the chat conversation" }],
  alice_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true, description: "The Alice agent object" },
  functions: [{ type: Schema.Types.ObjectId, ref: 'Task', default: [], description: "List of functions to be registered with the agent" }],
  executor: { type: Schema.Types.ObjectId, ref: 'Agent', required: true, description: "The executor agent object" },
  llm_config: { type: Schema.Types.Mixed, description: "The configuration for the LLM agent", default: {} },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

aliceChatSchema.virtual('apiRepresentation').get(function() {
  return {
    id: this._id,
    messages: this.messages.map(message => message.apiRepresentation),
    alice_agent: this.alice_agent ? (this.alice_agent._id || this.alice_agent) : null,
    functions: this.functions.map(func => func._id || func),
    executor: this.executor ? (this.executor._id || this.executor) : null,
    llm_config: this.llm_config || {},
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null
  };
});

// Function to ensure ObjectIds for nested fields
function ensureObjectIdForSave(next) {
  // Convert embedded messages' created_by to ObjectId if necessary
  this.messages.forEach(message => {
    if (message.created_by && message.created_by._id) {
      message.created_by = message.created_by._id;
    }
  });

  // Convert alice_agent and executor to ObjectId if necessary
  if (this.alice_agent && this.alice_agent._id) {
    this.alice_agent = this.alice_agent._id;
  }
  if (this.executor && this.executor._id) {
    this.executor = this.executor._id;
  }
  
  // Convert created_by and updated_by to ObjectId if necessary
  if (this.created_by && this.created_by._id) {
    this.created_by = this.created_by._id;
  }
  if (this.updated_by && this.updated_by._id) {
    this.updated_by = this.updated_by._id;
  }
  
  next();
}

// Function to ensure ObjectIds for update operations
function ensureObjectIdForUpdate(next) {
  if (this._update.messages) {
    this._update.messages.forEach(message => {
      if (message.created_by && message.created_by._id) {
        message.created_by = message.created_by._id;
      }
    });
  }

  if (this._update.alice_agent && this._update.alice_agent._id) {
    this._update.alice_agent = this._update.alice_agent._id;
  }
  if (this._update.executor && this._update.executor._id) {
    this._update.executor = this._update.executor._id;
  }

  if (this._update.created_by && this._update.created_by._id) {
    this._update.created_by = this._update.created_by._id;
  }
  if (this._update.updated_by && this._update.updated_by._id) {
    this._update.updated_by = this._update.updated_by._id;
  }
  
  next();
}

// Automatically populate references when finding documents
function autoPopulate() {
  this.populate('messages.created_by alice_agent executor created_by updated_by functions');
}

aliceChatSchema.pre('save', ensureObjectIdForSave);
aliceChatSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
aliceChatSchema.pre('find', autoPopulate);
aliceChatSchema.pre('findOne', autoPopulate);

const Message = mongoose.model('Message', messageSchema);
const AliceChat = mongoose.model('AliceChat', aliceChatSchema);

module.exports = { AliceChat, Message };

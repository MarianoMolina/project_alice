const mongoose = require('mongoose');
const { Schema } = mongoose;

const agentSchema = new Schema({
  name: { type: String, required: true },
  system_message: { type: String, default: "Below is an instruction that describes a task. Write a response that appropriately completes the request." },
  recommended_model: { type: String, default: null, allowNull: true },
  functions: { type: Array, default: [] },
  functions_map: { type: Map, of: String, default: {} }, // REMEMBER: Function name/signature should be stored here, not the callable/function -> How to retrieve the callable from the name without needing to list it manually?
  agents_in_group: { type: Array, default: [] },
  autogen_class: { type: String, enum: ["ConversableAgent", "AssistantAgent", "UserProxyAgent", "GroupChatManager", "LLaVAAgent"], default: "ConversableAgent" },
  code_execution_config: { type: Boolean, default: false },
  max_consecutive_auto_reply: { type: Number, default: 10 },
  human_input_mode: { type: String, enum: ["ALWAYS", "TERMINATE", "NEVER"], default: "NEVER" },
  speaker_selection: { type: Map, of: String, default: {} },
  default_auto_reply: { type: String, default: null, allowNull: true },
  llm_config: { type: Map, of: String, default: {}},
});

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;

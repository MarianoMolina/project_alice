const mongoose = require('mongoose');
const { Schema } = mongoose;
const { functionParametersSchema } = require('../utils/schemas');

const taskSchema = new Schema({
  task_name: { type: String, required: true },
  task_description: { type: String, required: true },
  task_type: { type: String, enum: ["CVGenerationTask", "RedditSearchTask", "APITask", "WikipediaSearchTask", "GoogleSearchTask", "ExaSearchTask", "ArxivSearchTask", "BasicAgentTask", "PromptAgentTask", "CheckTask", "CodeGenerationLLMTask", "CodeExecutionLLMTask", "AgentWithFunctions"], required: true }, 
  input_variables: { 
    type: functionParametersSchema, 
    default: null,
    set: v => (v === undefined ? null : v)  // Custom setter to handle default null value
  },
  exit_codes: { type: Map, of: String, default: { 0: "Success", 1: "Failed" } },
  recursive: { type: Boolean, default: true },
  templates: { type: Map, of: String, default: {} }, 
  tasks: [{ type: Map, of: String, default: {}}], 
  agent_name: { type: String, default: null, allowNull: true }, 
  valid_languages: [String],
  timeout: { type: Number, default: null, allowNull: true }, 
  prompts_to_add: { type: Map, of: String, default: null }, 
  exit_code_response_map: { type: Map, of: Number, default: null },
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

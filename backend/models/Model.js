const mongoose = require('mongoose');
const { Schema } = mongoose;
const LOCAL_LLM_API_URL = process.env.LOCAL_LLM_API_URL || 'https://localhost:1234/v1';

const modelSchema = new Schema({
  short_name: { type: String, required: true },
  model_name: { type: String, required: true },
  model_format: { type: String, required: true },
  ctx_size: { type: Number, required: true },
  model_type: { type: String, enum: ['instruct', 'chat', 'vision'], required: true },
  deployment: { type: String, enum: ['local', 'remote'], required: true },
  model_file: { type: String, default: null, allowNull: true },
  api_key: { type: String, default: 'lm-studio' },
  port: { type: Number, default: 1234 },
  api_type: { type: String, enum: ['openai', 'azure', 'anthropic'], default: 'openai' },
  base_url: { type: String, default: LOCAL_LLM_API_URL },
  autogen_model_client_cls: { type: String, default: null, allowNull: true },
});

const Model = mongoose.model('Model', modelSchema);

module.exports = Model;
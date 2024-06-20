const mongoose = require('mongoose');
const { Schema } = mongoose;

const promptSchema = new Schema({
  name: { type: String, required: true },
  content: { type: String, required: true }
});

const Prompt = mongoose.model('Prompt', promptSchema);
module.exports = Prompt;

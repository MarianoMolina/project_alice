const mongoose = require('mongoose');

const generatedCVSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobPositionDescription: { type: String, required: true },
  content: { type: String, required: true },
  templateId: String,
}, { timestamps: true });

const GeneratedCV = mongoose.model('GeneratedCV', generatedCVSchema);

module.exports = GeneratedCV;
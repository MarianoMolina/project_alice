const mongoose = require('mongoose');

const hobbySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
}, { timestamps: true });

const Hobby = mongoose.model('Hobby', hobbySchema);

module.exports = Hobby;
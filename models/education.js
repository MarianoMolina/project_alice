const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: String, required: true },
  degree: String,
  fieldOfStudy: String,
  startDate: Date,
  endDate: Date,
  description: String,
}, { timestamps: true });

const Education = mongoose.model('Education', educationSchema);

module.exports = Education;
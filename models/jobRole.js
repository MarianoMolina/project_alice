const mongoose = require('mongoose');

const jobRoleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  title: { type: String, required: true },
  description: String,
  startDate: Date,
  endDate: Date,
}, { timestamps: true });

const JobRole = mongoose.model('JobRole', jobRoleSchema);

module.exports = JobRole;
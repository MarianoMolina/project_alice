const mongoose = require('mongoose');

const jobRoleResponsibilitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRole', required: true },
  description: { type: String, required: true },
}, { timestamps: true });

const JobRoleResponsibility = mongoose.model('JobRoleResponsibility', jobRoleResponsibilitySchema);

module.exports = JobRoleResponsibility;
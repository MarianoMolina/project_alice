const mongoose = require('mongoose');

const jobRoleAccomplishmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRole', required: true },
  description: { type: String, required: true },
}, { timestamps: true });

const JobRoleAccomplishment = mongoose.model('JobRoleAccomplishment', jobRoleAccomplishmentSchema);

module.exports = JobRoleAccomplishment;
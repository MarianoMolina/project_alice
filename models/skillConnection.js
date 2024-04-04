const mongoose = require('mongoose');

const skillConnectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  jobRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRole' },
  responsibilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRoleResponsibility' },
  accomplishmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRoleAccomplishment' },
  educationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Education' },
  description: String,
}, { timestamps: true });

const SkillConnection = mongoose.model('SkillConnection', skillConnectionSchema);

module.exports = SkillConnection;
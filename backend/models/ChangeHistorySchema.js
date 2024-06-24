const mongoose = require('mongoose');
const { Schema } = mongoose;

const changeHistorySchema = new Schema({
  previous_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  updated_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  changed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
});

// Pre-save hook to ensure ObjectIds
function ensureObjectIdForSave(next) {
  if (this.previous_agent && this.previous_agent._id) {
    this.previous_agent = this.previous_agent._id;
  }
  if (this.updated_agent && this.updated_agent._id) {
    this.updated_agent = this.updated_agent._id;
  }
  if (this.changed_by && this.changed_by._id) {
    this.changed_by = this.changed_by._id;
  }
  next();
}

// Pre-update hook to ensure ObjectIds
function ensureObjectIdForUpdate(next) {
  if (this._update.previous_agent && this._update.previous_agent._id) {
    this._update.previous_agent = this._update.previous_agent._id;
  }
  if (this._update.updated_agent && this._update.updated_agent._id) {
    this._update.updated_agent = this._update.updated_agent._id;
  }
  if (this._update.changed_by && this._update.changed_by._id) {
    this._update.changed_by = this._update.changed_by._id;
  }
  next();
}

// Automatically populate references when finding documents
function autoPopulate() {
  this.populate('previous_agent updated_agent changed_by');
}

changeHistorySchema.pre('save', ensureObjectIdForSave);
changeHistorySchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
changeHistorySchema.pre('find', autoPopulate);
changeHistorySchema.pre('findOne', autoPopulate);

const ChangeHistory = mongoose.model('ChangeHistory', changeHistorySchema);
module.exports = ChangeHistory;

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
}, { 
  timestamps: true
});

userSchema.virtual('apiRepresentation').get(function() {
  return {
    id: this._id,
    name: this.name || null,
    email: this.email || null,
    role: this.role || "user",
    created_at: this.createdAt || null,
    updated_at: this.updatedAt || null
  };
});

const User = mongoose.model('User', userSchema);

module.exports = User;
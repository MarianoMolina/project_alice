import mongoose, { Schema } from 'mongoose';
import { IUserDocument, IUserModel } from '../interfaces/user.interface';

const userSchema = new Schema<IUserDocument, IUserModel>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: IUserDocument, ret: any) {
      delete ret.password;
      return ret;
    }
  }
});

userSchema.methods.apiRepresentation = function(this: IUserDocument) {
  return {
    _id: this._id,
    name: this.name || null,
    email: this.email || null,
    role: this.role || "user",
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null
  };
};

const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
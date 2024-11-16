import mongoose, { Schema } from 'mongoose';
import { IUserDocument, IUserModel } from '../interfaces/user.interface';
import { getObjectId } from '../utils/utils';

const userDefaultChatConfigSchema = new Schema({
  alice_agent: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  agent_tools: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  retrieval_tools: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  data_cluster: { type: Schema.Types.ObjectId, ref: 'DataCluster' },
  default_user_checkpoints: {
    type: Map,
    of: { type: Schema.Types.ObjectId, ref: 'UserCheckpoint' }
  }
}, { _id: false });

const userSchema = new Schema<IUserDocument, IUserModel>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  default_chat_config: { type: userDefaultChatConfigSchema, required: false }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: IUserDocument, ret: any) {
      delete ret.password;
      return ret;
    }
  }
});

function ensureObjectIdForSave(
  this: IUserDocument,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  if (this.default_chat_config) {
    if (this.default_chat_config.alice_agent) {
      this.default_chat_config.alice_agent = getObjectId(this.default_chat_config.alice_agent);
    }
    if (this.default_chat_config.data_cluster) {
      this.default_chat_config.data_cluster = getObjectId(this.default_chat_config.data_cluster);
    }
    if (this.default_chat_config.agent_tools && this.default_chat_config.agent_tools.length > 0) {
      this.default_chat_config.agent_tools = this.default_chat_config.agent_tools.map(tool => getObjectId(tool));
    }
    if (this.default_chat_config.retrieval_tools && this.default_chat_config.retrieval_tools.length > 0) {
      this.default_chat_config.retrieval_tools = this.default_chat_config.retrieval_tools.map(tool => getObjectId(tool));
    }
    if (this.default_chat_config.default_user_checkpoints instanceof Map) {
      for (const [key, value] of this.default_chat_config.default_user_checkpoints.entries()) {
        if (value) {
          this.default_chat_config.default_user_checkpoints.set(key, getObjectId(value));
        }
      }
    }
  }
  next();
}

function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (update.default_chat_config) {
    if (update.default_chat_config.alice_agent) {
      update.default_chat_config.alice_agent = getObjectId(update.default_chat_config.alice_agent);
    }
    if (update.default_chat_config.data_cluster) {
      update.default_chat_config.data_cluster = getObjectId(update.default_chat_config.data_cluster);
    }
    if (update.default_chat_config.agent_tools && update.default_chat_config.agent_tools.length > 0) {
      update.default_chat_config.agent_tools = update.default_chat_config.agent_tools.map((tool: any) => getObjectId(tool));
    }
    if (update.default_chat_config.retrieval_tools && update.default_chat_config.retrieval_tools.length > 0) {
      update.default_chat_config.retrieval_tools = update.default_chat_config.retrieval_tools.map((tool: any) => getObjectId(tool));
    }
    if (update.default_chat_config.default_user_checkpoints && typeof update.default_chat_config.default_user_checkpoints === 'object') {
      const newCheckpoints = new Map();
      for (const [key, value] of Object.entries(update.default_chat_config.default_user_checkpoints)) {
        if (value) {
          newCheckpoints.set(key, getObjectId(value));
        }
      }
      update.default_chat_config.default_user_checkpoints = newCheckpoints;
    }
  }
  next();
}

function autoPopulate(this: mongoose.Query<any, any>) {
  this.populate('default_chat_config.alice_agent')
    .populate('default_chat_config.agent_tools')
    .populate('default_chat_config.retrieval_tools')
    .populate('default_chat_config.data_cluster')
    .populate({
      path: 'default_chat_config.default_user_checkpoints.$*',
      model: 'UserCheckpoint'
    });
}

userSchema.methods.apiRepresentation = function(this: IUserDocument) {
  const defaultChatConfig = this.default_chat_config ? {
    alice_agent: this.default_chat_config.alice_agent ? 
      (this.default_chat_config.alice_agent._id || this.default_chat_config.alice_agent) : null,
    agent_tools: this.default_chat_config.agent_tools?.map(tool => tool._id || tool) || [],
    retrieval_tools: this.default_chat_config.retrieval_tools?.map(tool => tool._id || tool) || [],
    data_cluster: this.default_chat_config.data_cluster ? 
      (this.default_chat_config.data_cluster._id || this.default_chat_config.data_cluster) : null,
    default_user_checkpoints: this.default_chat_config.default_user_checkpoints || {}
  } : null;

  return {
    _id: this._id,
    name: this.name || null,
    email: this.email || null,
    role: this.role || "user",
    default_chat_config: defaultChatConfig,
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null
  };
};

userSchema.pre('save', ensureObjectIdForSave);
userSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
userSchema.pre('find', autoPopulate);
userSchema.pre('findOne', autoPopulate);

const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
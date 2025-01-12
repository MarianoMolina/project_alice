import mongoose, { Schema } from 'mongoose';
import { IUserDocument, IUserModel } from '../interfaces/user.interface';
import { getObjectId, getObjectIdForList, getObjectIdForMap } from '../utils/utils';
import Logger from '../utils/logger';

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
  password: { type: String },
  creationMethod: { type: String, enum: ["password", "google"] },
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
  try {
    if (this.default_chat_config) {
      const context = { model: 'User', field: 'default_chat_config' };
      if (this.default_chat_config.alice_agent) {
        this.default_chat_config.alice_agent = getObjectId(
          this.default_chat_config.alice_agent, 
          { ...context, field: 'default_chat_config.alice_agent' }
        );
      }
      if (this.default_chat_config.data_cluster) {
        this.default_chat_config.data_cluster = getObjectId(
          this.default_chat_config.data_cluster, 
          { ...context, field: 'default_chat_config.data_cluster' }
        );
      }
      if (this.default_chat_config.agent_tools?.length > 0) {
        this.default_chat_config.agent_tools = getObjectIdForList(this.default_chat_config.agent_tools, {...context, field: 'default_chat_config.agent_tools'});
      }
      if (this.default_chat_config.retrieval_tools?.length > 0) {
        this.default_chat_config.retrieval_tools = getObjectIdForList(this.default_chat_config.retrieval_tools, {...context, field: 'default_chat_config.retrieval_tools'});
      }
      if (this.default_chat_config.default_user_checkpoints instanceof Map) {
        this.default_chat_config.default_user_checkpoints = getObjectIdForMap(this.default_chat_config.default_user_checkpoints, {...context, field: 'default_chat_config.default_user_checkpoints'});
      }
    }
    next();
  } catch (error) {
    Logger.error('Error in User ensureObjectIdForSave:', {
      error: error instanceof Error ? error.message : String(error),
      userId: this._id
    });
    next(error instanceof Error ? error : new Error(String(error)));
  }
}

function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  try {
    const update = this.getUpdate() as any;
    if (!update?.default_chat_config) return next();
    const context = { model: 'User', field: 'default_chat_config' };
    if (update.default_chat_config.alice_agent) {
      update.default_chat_config.alice_agent = getObjectId(
        update.default_chat_config.alice_agent,
        { ...context, field: 'default_chat_config.alice_agent' }
      );
    }
    if (update.default_chat_config.data_cluster) {
      update.default_chat_config.data_cluster = getObjectId(
        update.default_chat_config.data_cluster,
        { ...context, field: 'default_chat_config.data_cluster' }
      );
    }
    if (update.default_chat_config.agent_tools?.length > 0) {
      update.default_chat_config.agent_tools = getObjectIdForList(update.default_chat_config.agent_tools, { ...context, field: 'default_chat_config.agent_tools' });
    }
    if (update.default_chat_config.retrieval_tools?.length > 0) {
      update.default_chat_config.retrieval_tools = getObjectIdForList(update.default_chat_config.retrieval_tools, { ...context, field: 'default_chat_config.retrieval_tools' });
    }
    if (update.default_chat_config.default_user_checkpoints && 
        typeof update.default_chat_config.default_user_checkpoints === 'object') {
      update.default_chat_config.default_user_checkpoints = getObjectIdForMap(update.default_chat_config.default_user_checkpoints, { ...context, field: 'default_chat_config.default_user_checkpoints' });
    }
    next();
  } catch (error) {
    Logger.error('Error in User ensureObjectIdForUpdate:', {
      error: error instanceof Error ? error.message : String(error),
      update: this.getUpdate()
    });
    next(error instanceof Error ? error : new Error(String(error)));
  }
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

const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
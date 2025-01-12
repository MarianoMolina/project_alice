import mongoose, { Schema } from 'mongoose';
import { IMessageDocument, IMessageModel, ContentType, RoleType, MessageGenerators } from '../interfaces/message.interface';
import { getObjectId, getObjectIdForList } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { referencesSchema } from './reference.model';
import { EncryptionService } from '../utils/encrypt.utils';

const messageSchema = new Schema<IMessageDocument, IMessageModel>({
  content: { 
    type: String, 
    description: "Content of the message",
    set: function(content: string) {
      if (!content) return content;
      try {
        return EncryptionService.getInstance().encrypt(content);
      } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt message content');
      }
    },
    get: function(encryptedContent: string) {
      if (!encryptedContent) return encryptedContent;
      try {
        return EncryptionService.getInstance().decrypt(encryptedContent);
      } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt message content');
      }
    }
  },
  role: {
    type: String,
    enum: Object.values(RoleType),
    default: RoleType.USER,
    description: "Role of the message",
  },
  generated_by: {
    type: String,
    enum: Object.values(MessageGenerators),
    default: MessageGenerators.USER,
    description: "Source that generated the message",
  },
  step: { 
    type: String, 
    default: "", 
    description: "Process that is creating this message" 
  },
  assistant_name: { 
    type: String, 
    default: "", 
    description: "Name of the assistant" 
  },
  type: {
    type: String,
    enum: Object.values(ContentType),
    default: ContentType.TEXT,
    description: "Type of the message"
  },
  references: { 
    type: referencesSchema, 
    default: {}, 
    description: "References associated with the message" 
  },
  creation_metadata: {
    type: Schema.Types.Mixed,
    default: {},
    description: "Metadata about the creation of the message",
  },
  embedding: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'EmbeddingChunk' 
  }],
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    description: "User ID used to call the endpoint",
    autopopulate: true,
  },
  updated_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    description: "User ID used to update the endpoint",
    autopopulate: true,
  },
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// API Representation method
messageSchema.methods.apiRepresentation = function (this: IMessageDocument) {
  return {
    id: this._id,
    content: this.content || null, // This will automatically decrypt
    role: this.role || RoleType.USER,
    generated_by: this.generated_by || MessageGenerators.USER,
    step: this.step || "",
    assistant_name: this.assistant_name || "",
    type: this.type || ContentType.TEXT,
    embedding: this.embedding || [],
    creation_metadata: this.creation_metadata || {},
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null,
    references: this.references || {},
  };
};

function ensureObjectIdForSave(
  this: IMessageDocument,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const context = { model: 'Message', field: '' };
  if (this.embedding) this.embedding = getObjectIdForList(this.embedding, { ...context, field: 'embedding' });
  if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
  next();
}

function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  
  const context = { model: 'Message', field: '' };
  
  if (update.embedding) update.embedding = getObjectIdForList(update.embedding, { ...context, field: 'embedding' });
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });

  // Handle $set operations
  if (update.$set) {
    if (update.$set.embedding) update.$set.embedding = getObjectIdForList(update.$set.embedding, { ...context, field: 'embedding' });
    if (update.$set.created_by) update.$set.created_by = getObjectId(update.$set.created_by, { ...context, field: 'created_by' });
    if (update.$set.updated_by) update.$set.updated_by = getObjectId(update.$set.updated_by, { ...context, field: 'updated_by' });
  }

  next();
}

// Pre-save middleware for handling encryption
messageSchema.pre('save', ensureObjectIdForSave);
messageSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

// Apply autopopulate plugin
messageSchema.plugin(mongooseAutopopulate);

// Create and export the model
const Message = mongoose.model<IMessageDocument, IMessageModel>('Message', messageSchema);
export default Message;
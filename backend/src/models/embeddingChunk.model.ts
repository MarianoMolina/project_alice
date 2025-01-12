import mongoose, { Schema } from 'mongoose';
import { getObjectId } from '../utils/utils';
import { IEmbeddingChunkDocument, IEmbeddingChunkModel } from '../interfaces/embeddingChunk.interface';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { EncryptionService } from '../utils/encrypt.utils';

const embeddingSchema = new Schema<IEmbeddingChunkDocument, IEmbeddingChunkModel>({
  vector: { type: [Number], required: true },
  text_content: {
    type: String, required: true,
    set: function (content: string) {
      if (!content) return content;
      try {
        return EncryptionService.getInstance().encrypt(content);
      } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt embedding chunk content');
      }
    },
    get: function (encryptedContent: string) {
      if (!encryptedContent) return encryptedContent;
      try {
        return EncryptionService.getInstance().decrypt(encryptedContent);
      } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt embedding chunk content');
      }
    }
  },
  index: { type: Number, required: true },
  creation_metadata: { type: Map, of: Schema.Types.Mixed },
  created_by: { type: Schema.Types.ObjectId },
  updated_by: { type: Schema.Types.ObjectId }
}, { timestamps: true });

embeddingSchema.methods.apiRepresentation = function (this: IEmbeddingChunkDocument) {
  return {
    id: this._id,
    vector: this.vector || null,
    text_content: this.text_content || null,
    index: this.index || null,
    creation_metadata: this.creation_metadata || null,
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null,
    created_by: this.created_by || null,
    updated_by: this.updated_by || null
  };
};

function ensureObjectId(this: IEmbeddingChunkDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const context = { model: 'EmbeddingChunk', field: '' };
  if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
  next();
}

function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  const context = { model: 'EmbeddingChunk', field: '' };
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
  next();
}

embeddingSchema.pre('save', ensureObjectId);
embeddingSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
embeddingSchema.plugin(mongooseAutopopulate);

const EmbeddingChunk = mongoose.model<IEmbeddingChunkDocument, IEmbeddingChunkModel>('EmbeddingChunk', embeddingSchema);

export default EmbeddingChunk;
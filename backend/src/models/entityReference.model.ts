import mongoose, { Schema } from "mongoose";
import { IEntityReferenceDocument, IEntityReferenceModel, ReferenceCategoryType } from "../interfaces/entityReference.interface";
import { getObjectId, getObjectIdForList } from "../utils/utils";
import mongooseAutopopulate from 'mongoose-autopopulate';
import { EncryptionService } from "../utils/encrypt.utils";
import { ApiType } from "../utils/api.utils";

const imageReferenceSchema = new Schema({
  url: { type: String, required: true },
  alt: String,
  caption: String
}, { _id: false });

const entityConnectionSchema = new Schema({
  entity_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'EntityReference',
  },
  similarity_score: { type: Number, default: 0 },
}, { _id: false });

const entityReferenceSchema = new Schema<IEntityReferenceDocument, IEntityReferenceModel>({
  source_id: String,
  name: String,
  description: {
    type: String,
    set: function (content: string) {
      if (!content) return content;
      try {
        return EncryptionService.getInstance().encrypt(content);
      } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt entity reference description');
      }
    },
    get: function (encryptedContent: string) {
      if (!encryptedContent) return encryptedContent;
      try {
        return EncryptionService.getInstance().decrypt(encryptedContent);
      } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt entity reference description');
      }
    }
  },
  content: {
    type: String,
    set: function (content: string) {
      if (!content) return content;
      try {
        return EncryptionService.getInstance().encrypt(content);
      } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt entity reference content');
      }
    },
    get: function (encryptedContent: string) {
      if (!encryptedContent) return encryptedContent;
      try {
        return EncryptionService.getInstance().decrypt(encryptedContent);
      } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt entity reference content');
      }
    }
  },
  url: String,
  images: [imageReferenceSchema],
  categories: [{
    type: String,
    enum: Object.values(ReferenceCategoryType),
    required: true
  }],
  embedding: [{ type: Schema.Types.ObjectId, ref: 'EmbeddingChunk', autopopulate: true }],
  source: { type: String, enum: Object.values(ApiType) },
  connections: [entityConnectionSchema],
  metadata: { type: Map, of: Schema.Types.Mixed },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: true },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: true }
}, { timestamps: true });

entityReferenceSchema.methods.apiRepresentation = function (this: IEntityReferenceDocument) {
  return {
    id: this._id || null,
    source_id: this.source_id || null,
    name: this.name || null,
    description: this.description || null,
    content: this.content || null,
    url: this.url || null,
    images: this.images || [],
    categories: this.categories || [],
    source: this.source || null,
    connections: this.connections || [],
    metadata: this.metadata || {},
    embedding: this.embedding || [],
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null,
    created_by: this.created_by || null,
    updated_by: this.updated_by || null
  };
};

function ensureObjectId(this: IEntityReferenceDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const context = { model: 'EntityReference', field: '' };
  if (this.embedding) this.embedding = getObjectIdForList(this.embedding, { ...context, field: 'embedding' });
  if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
  if (this.connections) {
    this.connections.forEach(conn => {
      if (conn.entity_id) {
        conn.entity_id = getObjectId(conn.entity_id, { ...context, field: 'connections.entity_id' });
      }
    });
  }
  next();
}

function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  const context = { model: 'EntityReference', field: '' };
  if (update.embedding) update.embedding = getObjectIdForList(update.embedding, { ...context, field: 'embedding' });
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
  if (update.connections) {
    update.connections.forEach((conn: any) => {
      if (conn.entity_id) {
        conn.entity_id = getObjectId(conn.entity_id, { ...context, field: 'connections.entity_id' });
      }
    });
  }
  next();
}

entityReferenceSchema.pre('save', ensureObjectId);
entityReferenceSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
entityReferenceSchema.plugin(mongooseAutopopulate);

const EntityReference = mongoose.model<IEntityReferenceDocument, IEntityReferenceModel>('EntityReference', entityReferenceSchema);

export default EntityReference;
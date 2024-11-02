import mongoose, { Schema, CallbackWithoutResultAndOptionalError, Query } from 'mongoose';
import { ensureObjectIdHelper } from '../utils/utils';
import { IEmbeddingChunkDocument, IEmbeddingChunkModel } from '../interfaces/embeddingChunk.interface';

const embeddingSchema = new Schema<IEmbeddingChunkDocument, IEmbeddingChunkModel>({

  vector: { type: [Number], required: true },
  text_content: { type: String, required: true },
  index: { type: Number, required: true },
  creation_metadata: { type: Map, of: Schema.Types.Mixed },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
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

function ensureObjectId(this: IEmbeddingChunkDocument, next: CallbackWithoutResultAndOptionalError) {
  this.created_by = ensureObjectIdHelper(this.created_by);
  this.updated_by = ensureObjectIdHelper(this.updated_by);
  next();
}


function ensureObjectIdForUpdate(this: Query<any, any>, next: CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;

  if (update.created_by) {
    update.created_by = ensureObjectIdHelper(update.created_by);
  }
  if (update.updated_by) {
    update.updated_by = ensureObjectIdHelper(update.updated_by);
  }
  next();
};


function autoPopulate(this: Query<any, any>, next: CallbackWithoutResultAndOptionalError) {
  this.populate('created_by updated_by');
  next();
}

embeddingSchema.pre('save', ensureObjectId);
embeddingSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
embeddingSchema.pre('find', autoPopulate);
embeddingSchema.pre('findOne', autoPopulate);

const EmbeddingChunk = mongoose.model<IEmbeddingChunkDocument, IEmbeddingChunkModel>('EmbeddingChunk', embeddingSchema);

export default EmbeddingChunk;
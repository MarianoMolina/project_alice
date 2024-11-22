import mongoose, { Schema } from 'mongoose';
import { IFileReferenceDocument, IFileReferenceModel, FileType } from '../interfaces/file.interface';
import { getObjectId, getObjectIdForList } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';

const fileReferenceSchema = new Schema<IFileReferenceDocument, IFileReferenceModel>({
  filename: { type: String, required: true },
  type: { type: String, enum: Object.values(FileType), required: true },
  file_size: { type: Number, required: true },
  storage_path: { type: String, required: true },
  transcript: { 
    type: Schema.Types.ObjectId, 
    ref: 'Message',
    autopopulate: true 
  },
  embedding: [{ type: Schema.Types.ObjectId, ref: 'EmbeddingChunk', autopopulate: true }],
  created_by: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    autopopulate: true 
  },
  updated_by: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    autopopulate: true 
  },
  last_accessed: { type: Date },
}, { timestamps: true });

fileReferenceSchema.methods.apiRepresentation = function (this: IFileReferenceDocument) {
  return {
    id: this._id,
    filename: this.filename,
    type: this.type,
    file_size: this.file_size,
    storage_path: this.storage_path,
    transcript: this.transcript ? (this.transcript._id || this.transcript) : null,
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
    last_accessed: this.last_accessed,
    embedding: this.embedding || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

function ensureObjectIdForFile(
  this: IFileReferenceDocument,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const context = { model: 'FileReference', field: '' };
  if (this.embedding) this.embedding = getObjectIdForList(this.embedding, { ...context, field: 'embedding' });
  if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
  if (this.transcript) this.transcript = getObjectId(this.transcript, { ...context, field: 'transcript' });
  next();
}

function ensureObjectIdForUpdateFile(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (!update) return next();
  const context = { model: 'FileReference', field: '' };
  if (update.embedding) update.embedding = getObjectIdForList(update.embedding, { ...context, field: 'embedding' });
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
  if (update.transcript) update.transcript = getObjectId(update.transcript, { ...context, field: 'transcript' });
  next();
}

fileReferenceSchema.pre('save', ensureObjectIdForFile);
fileReferenceSchema.pre('findOneAndUpdate', ensureObjectIdForUpdateFile);
fileReferenceSchema.plugin(mongooseAutopopulate);

const FileReference = mongoose.model<IFileReferenceDocument, IFileReferenceModel>(
  'FileReference',
  fileReferenceSchema
);

export default FileReference;
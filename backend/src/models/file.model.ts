import mongoose, { Schema } from 'mongoose';
import { IFileReferenceDocument, IFileReferenceModel, FileType } from '../interfaces/file.interface';
import { messageSchema } from './message.model';
import { ensureObjectIdHelper } from '../utils/utils';

const fileReferenceSchema = new Schema<IFileReferenceDocument, IFileReferenceModel>({
  filename: { type: String, required: true },
  type: { type: String, enum: Object.values(FileType), required: true },
  file_size: { type: Number, required: true },
  storage_path: { type: String, required: true },
  transcript: { type: messageSchema, required: false },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' },
  last_accessed: { type: Date }
}, { timestamps: true });

fileReferenceSchema.methods.apiRepresentation = function(this: IFileReferenceDocument) {
  return {
    id: this._id,
    filename: this.filename,
    type: this.type,
    file_size: this.file_size,
    storage_path: this.storage_path,
    transcript: this.transcript ? this.transcript.apiRepresentation() : null,
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
    last_accessed: this.last_accessed,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

function ensureObjectIdForFile(this: IFileReferenceDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  this.created_by = ensureObjectIdHelper(this.created_by);
  this.updated_by = ensureObjectIdHelper(this.updated_by);
  // this.transcript = ensureObjectIdHelper(this.transcript);
  next();
}

function ensureObjectIdForUpdateFile(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  update.created_by = ensureObjectIdHelper(update.created_by);
  update.updated_by = ensureObjectIdHelper(update.updated_by);
  // update.transcript = ensureObjectIdHelper(update.transcript);
  next();
}

function autoPopulateFile(this: mongoose.Query<any, any>) {
  this.populate('created_by updated_by transcript')
}

fileReferenceSchema.pre('save', ensureObjectIdForFile);
fileReferenceSchema.pre('findOneAndUpdate', ensureObjectIdForUpdateFile);
fileReferenceSchema.pre('find', autoPopulateFile);
fileReferenceSchema.pre('findOne', autoPopulateFile);

const FileReference = mongoose.model<IFileReferenceDocument, IFileReferenceModel>('FileReference', fileReferenceSchema);

export default FileReference;
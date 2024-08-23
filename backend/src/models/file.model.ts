import mongoose, { Schema } from 'mongoose';
import { IFileReferenceDocument, IFileReferenceModel, FileType } from '../interfaces/file.interface';

const fileReferenceSchema = new Schema<IFileReferenceDocument, IFileReferenceModel>({
    filename: { type: String, required: true },
    type: { type: String, enum: Object.values(FileType), required: true },
    file_size: { type: Number, required: true },
    storage_path: { type: String, required: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    last_accessed: { type: Date }
}, { timestamps: true });

fileReferenceSchema.methods.apiRepresentation = function(this: IFileReferenceDocument) {
    return {
        id: this._id,
        filename: this.filename,
        type: this.type,
        file_size: this.file_size,
        storage_path: this.storage_path, 
        created_by: this.created_by,
        last_accessed: this.last_accessed,
        updatedAt: this.updatedAt
    };
};

const FileReference = mongoose.model<IFileReferenceDocument, IFileReferenceModel>('FileReference', fileReferenceSchema);

export default FileReference;
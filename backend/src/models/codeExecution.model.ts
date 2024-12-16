import mongoose, { Schema } from 'mongoose';
import { ICodeExecutionDocument, ICodeExecutionModel } from '../interfaces/codeExecution.interface';
import { getObjectId, getObjectIdForList } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';

const codeExecutionSchema = new Schema<ICodeExecutionDocument, ICodeExecutionModel>({
    code_block: { type: Schema.Types.Mixed, required: true, description: "Code block to be executed by the tool" },
    code_output: { type: Schema.Types.Mixed, description: "Output of the code execution" },
    embedding: [{ type: Schema.Types.ObjectId, ref: 'EmbeddingChunk', autopopulate: true }],
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

codeExecutionSchema.methods.apiRepresentation = function(this: ICodeExecutionDocument) {
    return {
        id: this._id,
        code_block: this.code_block,
        code_output: this.code_output || null,
        embedding: this.embedding || [],
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        created_by: this.created_by,
        updated_by: this.updated_by,
    };
}

function ensureObjectId(
    this: ICodeExecutionDocument,
    next: mongoose.CallbackWithoutResultAndOptionalError
) {
    const context = { model: 'CodeExecution', field: '' };
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
    const context = { model: 'CodeExecution', field: '' };
    if (update.embedding) update.embedding = getObjectIdForList(update.embedding, { ...context, field: 'embedding' });
    if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
    if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
    next();
}

codeExecutionSchema.pre('save', ensureObjectId);
codeExecutionSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
codeExecutionSchema.plugin(mongooseAutopopulate);

const CodeExecution = mongoose.model<ICodeExecutionDocument, ICodeExecutionModel>('CodeExecution', codeExecutionSchema);

export default CodeExecution;
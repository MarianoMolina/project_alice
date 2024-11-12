import mongoose, { Schema } from 'mongoose';
import { ICodeExecutionDocument, ICodeExecutionModel } from '../interfaces/codeExecution.interface';

const codeExecutionSchema = new Schema<ICodeExecutionDocument, ICodeExecutionModel>({
    code_block: { type: Schema.Types.Mixed, required: true, description: "Code block to be executed by the tool" },
    code_output: { type: Schema.Types.Mixed, description: "Output of the code execution" },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

function ensureObjectId(
    this: ICodeExecutionDocument, 
    next: mongoose.CallbackWithoutResultAndOptionalError
) {
    if (this.created_by && (this.created_by as any)._id) {
        this.created_by = (this.created_by as any)._id;
    }
    if (this.updated_by && (this.updated_by as any)._id) {
        this.updated_by = (this.updated_by as any)._id;
    }
    next();
}
function ensureObjectIdForUpdate(
    this: mongoose.Query<any, any>,
    next: mongoose.CallbackWithoutResultAndOptionalError
  ) {
    const update = this.getUpdate() as any;
    if (update.created_by && update.created_by._id) {
        update.created_by = update.created_by._id;
    }
    if (update.updated_by && update.updated_by._id) {
        update.updated_by = update.updated_by._id;
    }
    next();
}
function autoPopulate(this: mongoose.Query<any, any>) {
    this.populate('created_by updated_by');
}

codeExecutionSchema.pre('save', ensureObjectId);
codeExecutionSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
codeExecutionSchema.pre('find', autoPopulate);
codeExecutionSchema.pre('findOne', autoPopulate);

const CodeExecution = mongoose.model<ICodeExecutionDocument, ICodeExecutionModel>('CodeExecution', codeExecutionSchema);

export default CodeExecution;
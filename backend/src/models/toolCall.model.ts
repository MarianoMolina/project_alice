import mongoose, { Schema } from 'mongoose';
import { IToolCallDocument, IToolCallModel } from '../interfaces/toolCall.interface';

const toolCallSchema = new Schema<IToolCallDocument, IToolCallModel>({
    type: { type: String, required: true, description: "Type of the parameter, like string or integer" },
    function: { type: Schema.Types.Mixed, required: true, description: "Function to be called" },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

function ensureObjectId(this: IToolCallDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
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
toolCallSchema.pre('save', ensureObjectId);
toolCallSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
toolCallSchema.pre('find', autoPopulate);
toolCallSchema.pre('findOne', autoPopulate);

const ToolCall = mongoose.model<IToolCallDocument, IToolCallModel>('ToolCall', toolCallSchema);

export default ToolCall;
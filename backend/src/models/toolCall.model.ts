import mongoose, { Schema } from 'mongoose';
import { IToolCallDocument, IToolCallModel } from '../interfaces/toolCall.interface';
import { getObjectId } from '../utils/utils';

const toolCallSchema = new Schema<IToolCallDocument, IToolCallModel>({
    type: { type: "String", required: true, description: "Literal function" },
    function: { type: Schema.Types.Mixed, required: true, description: "Function to be called" },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

function ensureObjectId(this: IToolCallDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
    if (this.created_by) this.created_by = getObjectId(this.created_by);
    if (this.updated_by) this.updated_by = getObjectId(this.updated_by);
    next();
}
function ensureObjectIdForUpdate(
    this: mongoose.Query<any, any>,
    next: mongoose.CallbackWithoutResultAndOptionalError
  ) {
    const update = this.getUpdate() as any;
    if (update.created_by) update.created_by = getObjectId(update.created_by);
    if (update.updated_by) update.updated_by = getObjectId(update.updated_by);
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
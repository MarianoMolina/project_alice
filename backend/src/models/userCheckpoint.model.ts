import mongoose, { CallbackWithoutResultAndOptionalError, Query, Schema } from "mongoose";
import { IUserCheckpointDocument, IUserCheckpointModel } from "../interfaces/userCheckpoint.interface";
import { getObjectId } from "../utils/utils";

const userCheckpointSchema = new Schema<IUserCheckpointDocument, IUserCheckpointModel>({
    user_prompt: { type: String, required: true },
    options_obj: { type: Map, of: String, required: true },
    task_next_obj: { type: Map, of: String, required: true },
    request_feedback: { type: Boolean, default: false },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

userCheckpointSchema.methods.apiRepresentation = function (this: IUserCheckpointDocument) {
    return {
        id: this._id,
        user_prompt: this.user_prompt || null,
        options_obj: this.options_obj || {},
        task_next_obj: this.task_next_obj || {},
        request_feedback: this.request_feedback || false,      
        createdAt: this.createdAt || null,
        updatedAt: this.updatedAt || null,
        created_by: this.created_by || null,
        updated_by: this.updated_by || null
    };
};

function ensureObjectId(this: IUserCheckpointDocument, next: CallbackWithoutResultAndOptionalError) {
    if (this.created_by) this.created_by = getObjectId(this.created_by);
    if (this.updated_by) this.updated_by = getObjectId(this.updated_by);
    next();
}

function ensureObjectIdForUpdate(this: Query<any, any>, next: CallbackWithoutResultAndOptionalError) {
    const update = this.getUpdate() as any;
    if (update.created_by) update.created_by = getObjectId(update.created_by);
    if (update.updated_by) update.updated_by = getObjectId(update.updated_by);
    next();
};


function autoPopulate(this: Query<any, any>, next: CallbackWithoutResultAndOptionalError) {
    this.populate('created_by updated_by');
    next();
}

userCheckpointSchema.pre('save', ensureObjectId);
userCheckpointSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
userCheckpointSchema.pre('find', autoPopulate);
userCheckpointSchema.pre('findOne', autoPopulate);

const UserCheckpoint = mongoose.model<IUserCheckpointDocument, IUserCheckpointModel>('UserCheckpoint', userCheckpointSchema);

export default UserCheckpoint;
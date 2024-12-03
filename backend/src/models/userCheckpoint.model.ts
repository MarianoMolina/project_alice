import mongoose, { Schema } from "mongoose";
import { IUserCheckpointDocument, IUserCheckpointModel } from "../interfaces/userCheckpoint.interface";
import { getObjectId } from "../utils/utils";
import mongooseAutopopulate from 'mongoose-autopopulate';

const userCheckpointSchema = new Schema<IUserCheckpointDocument, IUserCheckpointModel>({
    user_prompt: { type: String, required: true },
    options_obj: { type: Map, of: String, required: true },
    task_next_obj: { type: Map, of: String, required: true },
    request_feedback: { type: Boolean, default: false },
    created_by: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        autopopulate: true 
    },
    updated_by: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        autopopulate: true 
    }
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

function ensureObjectId(
    this: IUserCheckpointDocument, 
    next: mongoose.CallbackWithoutResultAndOptionalError
) {
    const context = { model: 'UserCheckpoint', field: '' };
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
    const context = { model: 'UserCheckpoint', field: '' };
    if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
    if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
    next();
}

userCheckpointSchema.pre('save', ensureObjectId);
userCheckpointSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
userCheckpointSchema.plugin(mongooseAutopopulate);

const UserCheckpoint = mongoose.model<IUserCheckpointDocument, IUserCheckpointModel>('UserCheckpoint', userCheckpointSchema);

export default UserCheckpoint;
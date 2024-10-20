import mongoose, { CallbackWithoutResultAndOptionalError, Query, Schema } from "mongoose";
import { IUserInteractionDocument, IUserInteractionModel } from "../interfaces/userInteraction.interface";
import { ensureObjectIdHelper } from "../utils/utils";

const userInteractionSchema = new Schema<IUserInteractionDocument, IUserInteractionModel>({
    user_checkpoint_id: { type: Schema.Types.ObjectId, ref: 'UserCheckpoint', required: true },
    task_response_id: { type: Schema.Types.ObjectId, ref: 'TaskResponse' },
    user_response: {
        selected_option: { type: Number, required: true },
        user_feedback: { type: String }
    },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

userInteractionSchema.methods.apiRepresentation = function (this: IUserInteractionDocument) {
    return {
        id: this._id,
        user_checkpoint_id: this.user_checkpoint_id || null,
        task_response_id: this.task_response_id || null,
        user_response: this.user_response || {},             
        createdAt: this.createdAt || null,
        updatedAt: this.updatedAt || null,
        created_by: this.created_by || null,
        updated_by: this.updated_by || null
    };
};

function ensureObjectId(this: IUserInteractionDocument, next: CallbackWithoutResultAndOptionalError) {
    this.user_checkpoint_id = ensureObjectIdHelper(this.user_checkpoint_id);
    this.task_response_id = ensureObjectIdHelper(this.task_response_id);
    this.created_by = ensureObjectIdHelper(this.created_by);
    this.updated_by = ensureObjectIdHelper(this.updated_by);
    next();
}

function ensureObjectIdForUpdate(this: Query<any, any>, next: CallbackWithoutResultAndOptionalError) {
    const update = this.getUpdate() as any;
    if (update.user_checkpoint_id) {
        update.user_checkpoint_id = ensureObjectIdHelper(update.user_checkpoint_id);
    }
    if (update.task_response_id) {
        update.task_response_id = ensureObjectIdHelper(update.task_response_id);
    }
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

userInteractionSchema.pre('save', ensureObjectId);
userInteractionSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
userInteractionSchema.pre('find', autoPopulate);
userInteractionSchema.pre('findOne', autoPopulate);

const UserInteraction = mongoose.model<IUserInteractionDocument, IUserInteractionModel>('UserInteraction', userInteractionSchema);

export default UserInteraction;
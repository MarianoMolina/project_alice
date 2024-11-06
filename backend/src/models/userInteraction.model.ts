import mongoose, { CallbackWithoutResultAndOptionalError, Query, Schema } from "mongoose";
import { IUserInteractionDocument, IUserInteractionModel } from "../interfaces/userInteraction.interface";
import { getObjectId } from "../utils/utils";
const userInteractionSchema = new Schema<IUserInteractionDocument, IUserInteractionModel>({
    user_checkpoint_id: { type: Schema.Types.ObjectId, ref: 'UserCheckpoint', required: true },
    task_response_id: { type: Schema.Types.ObjectId, ref: 'TaskResult' },
    user_response: {
        type: Schema.Types.Mixed, default: null, validate: {
            validator: function (v) {
                return v === null 
                    || (typeof v === 'object' && (v.selected_option === undefined 
                    || typeof v.selected_option === 'number') && (v.user_feedback === undefined 
                    || typeof v.user_feedback === 'string'));
            }
        },
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
    this.user_checkpoint_id = getObjectId(this.user_checkpoint_id);
    this.task_response_id = getObjectId(this.task_response_id);
    this.created_by = getObjectId(this.created_by);
    this.updated_by = getObjectId(this.updated_by);
    next();
}

function ensureObjectIdForUpdate(this: Query<any, any>, next: CallbackWithoutResultAndOptionalError) {
    const update = this.getUpdate() as any;
    if (update.user_checkpoint_id) {
        update.user_checkpoint_id = getObjectId(update.user_checkpoint_id);
    }
    if (update.task_response_id) {
        update.task_response_id = getObjectId(update.task_response_id);
    }
    if (update.created_by) {
        update.created_by = getObjectId(update.created_by);
    }
    if (update.updated_by) {
        update.updated_by = getObjectId(update.updated_by);
    }
    next();
};


function autoPopulate(this: Query<any, any>, next: CallbackWithoutResultAndOptionalError) {
    this.populate('created_by updated_by user_checkpoint_id');
    next();
}

userInteractionSchema.pre('save', ensureObjectId);
userInteractionSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
userInteractionSchema.pre('find', autoPopulate);
userInteractionSchema.pre('findOne', autoPopulate);

const UserInteraction = mongoose.model<IUserInteractionDocument, IUserInteractionModel>('UserInteraction', userInteractionSchema);

export default UserInteraction;
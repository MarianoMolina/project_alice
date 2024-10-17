import mongoose, { CallbackWithoutResultAndOptionalError, Query, Schema } from "mongoose";
import { IUserInteractionDocument, IUserInteractionModel } from "../interfaces/userInteraction.interface";
import { ensureObjectIdHelper } from "../utils/utils";

const userInteractionSchema = new Schema<IUserInteractionDocument, IUserInteractionModel>({
    user_prompt: { type: String, required: true },
    execution_history: { type: Map, of: Schema.Types.Mixed, required: true },
    options_obj: { type: Map, of: String, required: true },
    user_response: { type: Map, of: Schema.Types.Mixed },
    task_next_obj: { type: Map, of: String, required: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

userInteractionSchema.methods.apiRepresentation = function (this: IUserInteractionDocument) {
    return {
        id: this._id,
        user_prompt: this.user_prompt || null,
        execution_history: this.execution_history || {},
        options_obj: this.options_obj || {},
        user_response: this.user_response || {},
        task_next_obj: this.task_next_obj || {},        
        createdAt: this.createdAt || null,
        updatedAt: this.updatedAt || null,
        created_by: this.created_by || null,
        updated_by: this.updated_by || null
    };
};

function ensureObjectId(this: IUserInteractionDocument, next: CallbackWithoutResultAndOptionalError) {
    this.created_by = ensureObjectIdHelper(this.created_by);
    this.updated_by = ensureObjectIdHelper(this.updated_by);
    next();
}

function ensureObjectIdForUpdate(this: Query<any, any>, next: CallbackWithoutResultAndOptionalError) {
    const update = this.getUpdate() as any;
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
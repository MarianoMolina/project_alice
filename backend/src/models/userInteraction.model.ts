import mongoose, { Schema } from "mongoose";
import { IUserInteractionDocument, IUserInteractionModel, InteractionOwnerType } from "../interfaces/userInteraction.interface";
import { getObjectId, getObjectIdForList } from "../utils/utils";
import mongooseAutopopulate from 'mongoose-autopopulate';

const userInteractionSchema = new Schema<IUserInteractionDocument, IUserInteractionModel>({
    user_checkpoint_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'UserCheckpoint', 
        required: true,
        autopopulate: true 
    },
    owner: {
        type: {
            type: String,
            enum: Object.values(InteractionOwnerType),
            required: true
        },
        id: {
            type: Schema.Types.ObjectId,
            required: true
        }
    },
    user_response: {
        type: Schema.Types.Mixed,
        default: null,
        validate: {
            validator: function(v: any) {
                return v === null
                    || (typeof v === 'object' 
                        && (v.selected_option === undefined || typeof v.selected_option === 'number')
                        && (v.user_feedback === undefined || typeof v.user_feedback === 'string'));
            }
        },
    },
    embedding: [{ type: Schema.Types.ObjectId, ref: 'EmbeddingChunk', autopopulate: true }],
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

userInteractionSchema.methods.apiRepresentation = function(this: IUserInteractionDocument) {
    return {
        id: this._id,
        user_checkpoint_id: this.user_checkpoint_id || null,
        owner: this.owner || null,
        user_response: this.user_response || {},
        embedding: this.embedding || [],
        createdAt: this.createdAt || null,
        updatedAt: this.updatedAt || null,
        created_by: this.created_by || null,
        updated_by: this.updated_by || null
    };
};

function ensureObjectId(
    this: IUserInteractionDocument, 
    next: mongoose.CallbackWithoutResultAndOptionalError
) {
    const context = { model: 'UserInteraction', field: '' };
    if (this.user_checkpoint_id) {
        this.user_checkpoint_id = getObjectId(this.user_checkpoint_id, { ...context, field: 'user_checkpoint_id' });
    }
    if (this.owner?.id) {
        this.owner.id = getObjectId(this.owner.id, { ...context, field: 'owner.id' });
    }
    if (this.embedding) this.embedding = getObjectIdForList(this.embedding, { ...context, field: 'embedding' });
    if (this.created_by) {
        this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
    }
    if (this.updated_by) {
        this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
    }
    next();
}

function ensureObjectIdForUpdate(
    this: mongoose.Query<any, any>, 
    next: mongoose.CallbackWithoutResultAndOptionalError
) {
    const update = this.getUpdate() as any;
    if (!update) return next();
    const context = { model: 'UserInteraction', field: '' };
    
    if (update.user_checkpoint_id) {
        update.user_checkpoint_id = getObjectId(update.user_checkpoint_id, { ...context, field: 'user_checkpoint_id' });
    }
    if (update?.owner?.id) {
        update.owner.id = getObjectId(update.owner.id, { ...context, field: 'owner.id' });
    }
    if (update.embedding) update.embedding = getObjectIdForList(update.embedding, { ...context, field: 'embedding' });
    if (update.created_by) {
        update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
    }
    if (update.updated_by) {
        update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
    }
    next();
}

userInteractionSchema.pre('save', ensureObjectId);
userInteractionSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
userInteractionSchema.plugin(mongooseAutopopulate);

const UserInteraction = mongoose.model<IUserInteractionDocument, IUserInteractionModel>('UserInteraction', userInteractionSchema);

export default UserInteraction;

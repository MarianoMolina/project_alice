import mongoose, { Schema } from 'mongoose';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { getObjectId, getObjectIdForList } from '../utils/utils';
import { IChatThreadDocument, IChatThreadModel } from '../interfaces/thread.interface';

// Extended schema for DataCluster that includes document properties
const chatThreadSchema = new Schema<IChatThreadDocument, IChatThreadModel>({
    name: { type: String },
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: true },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true, autopopulate: true }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});


chatThreadSchema.methods.apiRepresentation = function (this: IChatThreadDocument) {
    return {
        id: this._id,
        name: this.name || null,
        messages: this.messages || [],
        created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
        updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
        createdAt: this.createdAt || null,
        updatedAt: this.updatedAt || null
    };
};

function ensureObjectIdForSave(
    this: IChatThreadDocument,
    next: mongoose.CallbackWithoutResultAndOptionalError
) {
    const context = { model: 'DataCluster', field: '' };
    if (this.messages) this.messages = getObjectIdForList(this.messages, { ...context, field: 'messages' });

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
    const context = { model: 'DataCluster', field: '' };

    const arrayFields = [
        'messages',
    ];

    arrayFields.forEach(field => {
        if (update[field]) update[field] = getObjectIdForList(update[field], { ...context, field });
    });

    if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
    if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
    next();
}

chatThreadSchema.plugin(mongooseAutopopulate);
chatThreadSchema.pre('save', ensureObjectIdForSave);
chatThreadSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

export const ChatThread = mongoose.model<IChatThreadDocument, IChatThreadModel>('ChatThread', chatThreadSchema);
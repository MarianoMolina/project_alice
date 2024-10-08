import mongoose, { CallbackWithoutResultAndOptionalError, Query, Schema } from "mongoose";
import { IURLReferenceDocument, IURLReferenceModel } from "../interfaces/urlReference.interface";
import { ensureObjectIdHelper } from "../utils/utils";


const urlReferenceSchema = new Schema<IURLReferenceDocument, IURLReferenceModel>({
    title: { type: String, required: true },
    url: { type: String, required: true },
    content: { type: String, required: true },
    metadata: { type: Map, of: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

urlReferenceSchema.methods.apiRepresentation = function (this: IURLReferenceDocument) {
    return {
        id: this._id,
        title: this.title || null,
        url: this.url || null,
        content: this.content || null,
        metadata: this.metadata || {},
        createdAt: this.createdAt || null,
        updatedAt: this.updatedAt || null,
        created_by: this.created_by || null,
        updated_by: this.updated_by || null
    };
};

function ensureObjectId(this: IURLReferenceDocument, next: CallbackWithoutResultAndOptionalError) {
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

urlReferenceSchema.pre('save', ensureObjectId);
urlReferenceSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
urlReferenceSchema.pre('find', autoPopulate);
urlReferenceSchema.pre('findOne', autoPopulate);

const URLReference = mongoose.model<IURLReferenceDocument, IURLReferenceModel>('URLReference', urlReferenceSchema);

export default URLReference;
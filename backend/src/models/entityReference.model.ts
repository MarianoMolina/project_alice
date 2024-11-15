import mongoose, { CallbackWithoutResultAndOptionalError, Query, Schema } from "mongoose";
import { IEntityReferenceDocument, IEntityReferenceModel } from "../interfaces/entityReference.interface";
import { getObjectId } from "../utils/utils";
import { ApiType } from "../interfaces/api.interface";

const imageReferenceSchema = new Schema({
  url: { type: String, required: true },
  alt: String,
  caption: String
}, { _id: false });

const referenceCategorySchema = new Schema({
  name: { type: String, required: true },
  type: String,
  description: String
}, { _id: false });

const entityConnectionSchema = new Schema({
  entityId: { type: Schema.Types.ObjectId, required: true, ref: 'EntityReference' },
  relationshipType: { type: String, required: true },
  metadata: { type: Map, of: Schema.Types.Mixed }
}, { _id: false });

const entityReferenceSchema = new Schema<IEntityReferenceDocument, IEntityReferenceModel>({
  source_id: String,
  name: String,
  description: String,
  content: String,
  url: String,
  images: [imageReferenceSchema],
  categories: [referenceCategorySchema],
  source: { type: String, enum: Object.values(ApiType) },
  connections: [entityConnectionSchema],
  metadata: { type: Map, of: Schema.Types.Mixed },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

entityReferenceSchema.methods.apiRepresentation = function(this: IEntityReferenceDocument) {
  return {
    id: this._id,
    source_id: this.source_id,
    name: this.name,
    description: this.description,
    content: this.content,
    url: this.url,
    images: this.images,
    categories: this.categories,
    source: this.source,
    connections: this.connections,
    metadata: this.metadata || {},
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    created_by: this.created_by,
    updated_by: this.updated_by
  };
};

function ensureObjectId(this: IEntityReferenceDocument, next: CallbackWithoutResultAndOptionalError) {
  if (this.created_by) this.created_by = getObjectId(this.created_by);
  if (this.updated_by) this.updated_by = getObjectId(this.updated_by);
  if (this.connections) {
    this.connections.forEach(conn => {
      conn.entityId = getObjectId(conn.entityId);
    });
  }
  next();
}

function ensureObjectIdForUpdate(this: Query<any, any>, next: CallbackWithoutResultAndOptionalError) {
  const update = this.getUpdate() as any;
  if (update.created_by) update.created_by = getObjectId(update.created_by);
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by);
  if (update.connections) {
    update.connections.forEach((conn: any) => {
      conn.entityId = getObjectId(conn.entityId);
    });
  }
  next();
}

function autoPopulate(this: Query<any, any>, next: CallbackWithoutResultAndOptionalError) {
  this.populate('created_by updated_by');
  this.populate('connections.entityId');
  next();
}

entityReferenceSchema.pre('save', ensureObjectId);
entityReferenceSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
entityReferenceSchema.pre('find', autoPopulate);
entityReferenceSchema.pre('findOne', autoPopulate);

const EntityReference = mongoose.model<IEntityReferenceDocument, IEntityReferenceModel>('EntityReference', entityReferenceSchema);

export default EntityReference;
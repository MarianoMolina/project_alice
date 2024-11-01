import mongoose, { Schema } from 'mongoose';
import { IDataClusterDocument, IDataClusterModel, References } from "../interfaces/references.interface";
import mongooseAutopopulate from 'mongoose-autopopulate';

export const referencesSchema = new Schema<References>({
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message', autopopulate: true }],
    files: [{ type: Schema.Types.ObjectId, ref: 'FileReference', autopopulate: true }],
    task_responses: [{ type: Schema.Types.ObjectId, ref: 'TaskResult', autopopulate: true }],
    url_references: [{ type: Schema.Types.ObjectId, ref: 'URLReference', autopopulate: true }],
    string_outputs: [String]
});

referencesSchema.plugin(mongooseAutopopulate);

export const DataCluster = mongoose.model<IDataClusterDocument, IDataClusterModel>('DataCluster', referencesSchema);
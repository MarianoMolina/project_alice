import { Schema } from "mongoose";
import { References } from "../interfaces/references.interface";
import mongooseAutopopulate from 'mongoose-autopopulate';

export const referencesSchema = new Schema<References>({
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message', autopopulate: true }],
    files: [{ type: Schema.Types.ObjectId, ref: 'FileReference', autopopulate: true }],
    task_responses: [{ type: Schema.Types.ObjectId, ref: 'TaskResult', autopopulate: true }],
    search_results: [{ type: Schema.Types.ObjectId, ref: 'URLReference', autopopulate: true }],
    string_outputs: [String]
});

referencesSchema.plugin(mongooseAutopopulate);

export default referencesSchema;
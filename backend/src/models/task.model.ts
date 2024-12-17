import mongoose, { Schema } from 'mongoose';
import { functionParametersSchema } from './functionSchema';
import { ensureObjectIdForProperties, getObjectId, getObjectIdForMap } from '../utils/utils';
import { ITaskDocument, ITaskModel, TaskType } from '../interfaces/task.interface';
import mongooseAutopopulate from 'mongoose-autopopulate';

const taskSchema = new Schema<ITaskDocument, ITaskModel>({
    task_name: { type: String, required: true },
    task_description: { type: String, required: true },
    task_type: { type: String, enum: Object.values(TaskType), required: true },
    input_variables: { type: functionParametersSchema },
    exit_codes: {
        type: Map,
        of: String,
        default: () => new Map([['0', 'Success'], ['1', 'Failed']])
    },
    recursive: { type: Boolean, default: true },
    templates: { 
        type: Map, 
        of: { type: Schema.Types.ObjectId, ref: 'Prompt', autopopulate: true },
        default: null 
    },
    tasks: { 
        type: Map, 
        of: { type: Schema.Types.ObjectId, ref: 'Task', autopopulate: true },
        default: null 
    },
    exit_code_response_map: { type: Map, of: Number, default: null },
    start_node: { type: String, default: null },
    node_end_code_routing: { type: Map, of: Map, default: null },
    max_attempts: { type: Number, default: 1 },
    required_apis: { type: [String], default: null },
    agent: { 
        type: Schema.Types.ObjectId, 
        ref: 'Agent', 
        default: null,
        autopopulate: true 
    },
    user_checkpoints: { 
        type: Map, 
        of: { type: Schema.Types.ObjectId, ref: 'UserCheckpoint', autopopulate: true },
        default: null 
    },
    data_cluster: { 
        type: Schema.Types.ObjectId, 
        ref: 'DataCluster', 
        required: false, 
        description: "Data cluster for the chat"
    },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

taskSchema.methods.apiRepresentation = function (this: ITaskDocument) {
    return {
        id: this._id,
        task_name: this.task_name || null,
        task_description: this.task_description || null,
        task_type: this.task_type || null,
        input_variables: this.input_variables || null,
        exit_codes: this.exit_codes ? Object.fromEntries(this.exit_codes) : {},
        recursive: this.recursive || false,
        templates: this.templates ? Object.fromEntries(this.templates) : null,
        tasks: this.tasks ? Object.fromEntries(this.tasks) : null,
        exit_code_response_map: this.exit_code_response_map ? Object.fromEntries(this.exit_code_response_map) : null,
        start_node: this.start_node || null,
        node_end_code_routing: this.node_end_code_routing ? Object.fromEntries(
            Array.from(this.node_end_code_routing.entries()).map(([key, value]) => [key, Object.fromEntries(value)])
        ) : null,
        data_cluster: this.data_cluster || null,
        max_attempts: this.max_attempts || 1,
        agent: this.agent ? (this.agent._id || this.agent) : null,
        created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
        updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
        createdAt: this.createdAt || null,
        updatedAt: this.updatedAt || null
    };
};

function ensureObjectIdForSave(this: ITaskDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
    try {
        const context = { model: 'Task', field: '' };
        if (this.agent) this.agent = getObjectId(this.agent, { ...context, field: 'agent' });
        if (this.data_cluster) this.data_cluster = getObjectId(this.data_cluster, { ...context, field: 'data_cluster' });
        if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
        if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
        if (this.templates) this.templates = getObjectIdForMap(this.templates, { ...context, field: 'templates' });
        if (this.tasks) this.tasks = getObjectIdForMap(this.tasks, { ...context, field: 'tasks' });
        if (this.user_checkpoints) this.user_checkpoints = getObjectIdForMap(this.user_checkpoints, { ...context, field: 'user_checkpoints' });
        if (this.input_variables?.properties) {
            this.input_variables.properties = ensureObjectIdForProperties(this.input_variables.properties);
        }
        next();
    } catch (error) {
        next(error instanceof Error ? error : new Error(String(error)));
    }
}

function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
    try {
        const update = this.getUpdate() as any;
        if (!update) return next();
        const context = { model: 'Task', field: '' };
        if (update.agent) update.agent = getObjectId(update.agent, { ...context, field: 'agent' });
        if (update.data_cluster) update.data_cluster = getObjectId(update.data_cluster, { ...context, field: 'data_cluster' });
        if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
        if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
        if (update.templates) update.templates = getObjectIdForMap(update.templates, { ...context, field: 'templates' });
        if (update.tasks) update.tasks = getObjectIdForMap(update.tasks, { ...context, field: 'tasks' });
        if (update.user_checkpoints) update.user_checkpoints = getObjectIdForMap(update.user_checkpoints, { ...context, field: 'user_checkpoints' });
        if (update.input_variables?.properties) {
            update.input_variables.properties = ensureObjectIdForProperties(update.input_variables.properties);
        }

        next();
    } catch (error) {
        next(error instanceof Error ? error : new Error(String(error)));
    }
}

taskSchema.pre('save', ensureObjectIdForSave);
taskSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
taskSchema.plugin(mongooseAutopopulate);

const Task = mongoose.model<ITaskDocument, ITaskModel>('Task', taskSchema);

export default Task;
import mongoose, { Schema } from 'mongoose';
import { functionParametersSchema, apiEngineSchema } from '../utils/schemas';
import { ensureObjectIdForProperties, ensureObjectIdForAPIEngine } from '../utils/utils';
import { ITaskDocument, ITaskModel, TaskType } from '../interfaces/task.interface';
import { ensureObjectIdHelper } from '../utils/utils';

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
    templates: { type: Map, of: Schema.Types.ObjectId, ref: 'Prompt', default: null },
    tasks: { type: Map, of: Schema.Types.ObjectId, ref: 'Task', default: null },
    valid_languages: [String],
    timeout: { type: Number, default: null },
    prompts_to_add: { type: Map, of: Schema.Types.ObjectId, ref: 'Prompt', default: null },
    exit_code_response_map: { type: Map, of: Number, default: null },
    start_task: { type: String, default: null },
    task_selection_method: { type: Schema.Types.Mixed, default: null },
    tasks_end_code_routing: { type: Map, of: Map, default: null },
    max_attempts: { type: Number, default: 3 },
    required_apis: { type: [String], default: null },
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', default: null },
    human_input: { type: Boolean, default: false },
    api_engine: { type: apiEngineSchema, default: null },
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
        valid_languages: this.valid_languages || [],
        timeout: this.timeout || null,
        prompts_to_add: this.prompts_to_add ? Object.fromEntries(this.prompts_to_add) : null,
        exit_code_response_map: this.exit_code_response_map ? Object.fromEntries(this.exit_code_response_map) : null,
        start_task: this.start_task || null,
        task_selection_method: this.task_selection_method || null,
        tasks_end_code_routing: this.tasks_end_code_routing ? Object.fromEntries(
            Array.from(this.tasks_end_code_routing.entries()).map(([key, value]) => [key, Object.fromEntries(value)])
        ) : null,
        max_attempts: this.max_attempts || 3,
        agent: this.agent ? (this.agent._id || this.agent) : null,
        human_input: this.human_input || false,
        api_engine: this.api_engine || null,
        created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
        updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
        created_at: this.createdAt || null,
        updated_at: this.updatedAt || null
    };
};

function ensureObjectIdForSave(this: ITaskDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
    this.agent = ensureObjectIdHelper(this.agent);
    this.created_by = ensureObjectIdHelper(this.created_by);
    this.updated_by = ensureObjectIdHelper(this.updated_by);

    if (this.templates) {
        for (const [key, value] of this.templates.entries()) {
            this.templates.set(key, ensureObjectIdHelper(value));
        }
    }
    if (this.tasks) {
        for (const [key, value] of this.tasks.entries()) {
            this.tasks.set(key, ensureObjectIdHelper(value));
        }
    }
    if (this.prompts_to_add) {
        for (const [key, value] of this.prompts_to_add.entries()) {
            this.prompts_to_add.set(key, ensureObjectIdHelper(value));
        }
    }
    if (this.input_variables && this.input_variables.properties) {
        this.input_variables.properties = ensureObjectIdForProperties(this.input_variables.properties);
    }
    if (this.api_engine) ensureObjectIdForAPIEngine(this.api_engine);
    next();
}

function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
    const update = this.getUpdate() as any;

    if (update.templates) {
        update.templates = Object.fromEntries(
            Object.entries(update.templates).map(([key, value]) => [key, ensureObjectIdHelper(value)])
        );
    }
    if (update.tasks) {
        update.tasks = Object.fromEntries(
            Object.entries(update.tasks).map(([key, value]) => [key, ensureObjectIdHelper(value)])
        );
    }
    if (update.prompts_to_add) {
        update.prompts_to_add = Object.fromEntries(
            Object.entries(update.prompts_to_add).map(([key, value]) => [key, ensureObjectIdHelper(value)])
        );
    }
    update.agent = ensureObjectIdHelper(update.agent);
    update.created_by = ensureObjectIdHelper(update.created_by);
    update.updated_by = ensureObjectIdHelper(update.updated_by);

    if (update.api_engine) ensureObjectIdForAPIEngine(update.api_engine);

    if (update && update.input_variables && update.input_variables.properties) {
        update.input_variables.properties = ensureObjectIdForProperties(update.input_variables.properties);
    }
    next();
}

function autoPopulate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
    this.populate('created_by')
        .populate('updated_by')
        .populate('agent')

    this.populate({
        path: 'templates',
        options: { strictPopulate: false }
    });
    this.populate({
        path: 'tasks.$*',
        model: 'Task'
    });
    this.populate({
        path: 'prompts_to_add',
        options: { strictPopulate: false }
    });
    this.populate('input_variables.properties');
    this.populate('api_engine.input_variables.properties');
    next();
}

taskSchema.pre('save', ensureObjectIdForSave);
taskSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
taskSchema.pre('find', autoPopulate);
taskSchema.pre('findOne', autoPopulate);

const Task = mongoose.model<ITaskDocument, ITaskModel>('Task', taskSchema);

export default Task;
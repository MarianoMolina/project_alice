import mongoose, { Schema, Model, Types } from 'mongoose';
import { functionParametersSchema } from '../utils/schemas';
import { ITaskDocument } from '../interfaces/task.interface';

const taskSchema = new Schema<ITaskDocument>({
    task_name: { type: String, required: true, unique: true },
    task_description: { type: String, required: true },
    task_type: { type: String, enum: ["CVGenerationTask", "RedditSearchTask", "APITask", "WikipediaSearchTask", "GoogleSearchTask", "ExaSearchTask", "ArxivSearchTask", "BasicAgentTask", "PromptAgentTask", "CheckTask", "CodeGenerationLLMTask", "CodeExecutionLLMTask", "AgentWithFunctions"], required: true },
    input_variables: {
        type: functionParametersSchema,
        default: null,
        set: (v: any) => (v === undefined ? null : v)
    },
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
    agent: { type: Schema.Types.ObjectId, ref: 'Agent', default: null },
    execution_agent: { type: Schema.Types.ObjectId, ref: 'Agent', default: null },
    human_input: { type: Boolean, default: false },
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
        execution_agent: this.execution_agent ? (this.execution_agent._id || this.execution_agent) : null,
        human_input: this.human_input || false,
        created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
        updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
        created_at: this.createdAt || null,
        updated_at: this.updatedAt || null
    };
};

function ensureObjectIdForSave(this: ITaskDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
    if (this.templates) {
        for (const [key, value] of this.templates.entries()) {
            if (value && (value as any)._id) {
                this.templates.set(key, (value as any)._id);
            }
        }
    }
    if (this.tasks) {
        for (const [key, value] of this.tasks.entries()) {
            if (value && (value as any)._id) {
                this.tasks.set(key, (value as any)._id);
            }
        }
    }
    if (this.prompts_to_add) {
        for (const [key, value] of this.prompts_to_add.entries()) {
            if (value && (value as any)._id) {
                this.prompts_to_add.set(key, (value as any)._id);
            }
        }
    }
    if (this.agent && (this.agent as any)._id) {
        this.agent = (this.agent as any)._id;
    }
    if (this.execution_agent && (this.execution_agent as any)._id) {
        this.execution_agent = (this.execution_agent as any)._id;
    }
    if (this.created_by && (this.created_by as any)._id) {
        this.created_by = (this.created_by as any)._id;
    }
    if (this.updated_by && (this.updated_by as any)._id) {
        this.updated_by = (this.updated_by as any)._id;
    }
    if (this.input_variables && this.input_variables.properties) {
        for (const key in this.input_variables.properties) {
            if (this.input_variables.properties[key]._id) {
                this.input_variables.properties[key] = this.input_variables.properties[key]._id;
            }
        }
    }
    next();
}

function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
    const update = this.getUpdate() as any;
    
    const ensureObjectId = (value: any): Types.ObjectId | any => {
      if (value && typeof value === 'object' && '_id' in value) {
        return value._id;
      }
      return value;
    };
  
    if (update.templates) {
      update.templates = Object.fromEntries(
        Object.entries(update.templates).map(([key, value]) => [key, ensureObjectId(value)])
      );
    }
    if (update.tasks) {
      update.tasks = Object.fromEntries(
        Object.entries(update.tasks).map(([key, value]) => [key, ensureObjectId(value)])
      );
    }
    if (update.prompts_to_add) {
      update.prompts_to_add = Object.fromEntries(
        Object.entries(update.prompts_to_add).map(([key, value]) => [key, ensureObjectId(value)])
      );
    }
    update.agent = ensureObjectId(update.agent);
    update.execution_agent = ensureObjectId(update.execution_agent);
    update.created_by = ensureObjectId(update.created_by);
    update.updated_by = ensureObjectId(update.updated_by);
  
    if (update.input_variables && update.input_variables.properties) {
      update.input_variables.properties = Object.fromEntries(
        Object.entries(update.input_variables.properties).map(([key, value]) => [key, ensureObjectId(value)])
      );
    }
    next();
  }

function autoPopulate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
    this.populate('created_by')
        .populate('updated_by')
        .populate('agent')
        .populate('execution_agent');

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
    this.populate({
        path: 'input_variables.properties',
        populate: { path: '$*', model: 'ParameterDefinition' }
    });
    next();
}

taskSchema.pre('save', ensureObjectIdForSave);
taskSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
taskSchema.pre('find', autoPopulate);
taskSchema.pre('findOne', autoPopulate);

const Task = mongoose.model<ITaskDocument, Model<ITaskDocument>>('Task', taskSchema);

export default Task;
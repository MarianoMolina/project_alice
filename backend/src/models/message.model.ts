import mongoose, { Schema } from 'mongoose';
import { IMessageDocument } from '../interfaces/message.interface';
import { ensureObjectIdHelper } from '../utils/utils';

export const messageSchema = new Schema<IMessageDocument>({
    content: { type: String, description: "Content of the message" },
    role: { type: String, enum: ["user", "assistant", "system", "tool"], default: "user", description: "Role of the message" },
    generated_by: { type: String, enum: ["user", "llm", "tool"], default: "user", description: "Source that generated the message" },
    step: { type: String, default: "", description: "Process that is creating this message, usually the task_name or tool_name" },
    assistant_name: { type: String, default: "", description: "Name of the assistant" },
    context: { type: Schema.Types.Mixed, default: null, description: "Context of the message" },
    type: { type: String, default: "text", description: "Type of the message" },
    tool_calls: { type: Schema.Types.Mixed, default: [], description: "List of tool calls in the message" },
    tool_call_id: { type: String, default: null, description: "ID of the tool call, if any" },
    request_type: { type: String, default: null, description: "Request type of the message, if any. Can be 'approval', 'confirmation', etc." },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', description: "User ID used to call the endpoint" },
    references: [{ type: Schema.Types.ObjectId, ref: 'FileReference' }],
    task_responses: [{ type: Schema.Types.ObjectId, ref: 'TaskResult' }],
    creation_metadata: { type: Schema.Types.Mixed, default: {}, description: "Metadata about the creation of the message" }
}, { timestamps: true });

messageSchema.methods.apiRepresentation = function (this: IMessageDocument) {
    return {
        id: this._id,
        content: this.content || null,
        role: this.role || "user",
        generated_by: this.generated_by || "user",
        step: this.step || "",
        assistant_name: this.assistant_name || "",
        context: this.context || null,
        tool_calls: this.tool_calls || [],
        type: this.type || "text",
        tool_call_id: this.tool_call_id || null,
        request_type: this.request_type || null,
        creation_metadata: this.creation_metadata || {},
        created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
        createdAt: this.createdAt || null,
        updatedAt: this.updatedAt || null,
        references: this.references || []
    };
};

function ensureObjectIdForMessage(this: IMessageDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
    if (this.references) {
        this.references = this.references.map(reference => ensureObjectIdHelper(reference));
    }
    if (this.task_responses) {
        this.task_responses = this.task_responses.map(taskResponse => ensureObjectIdHelper(taskResponse));
    }
    this.created_by = ensureObjectIdHelper(this.created_by);
    next();
}

function autoPopulateMessage(this: mongoose.Query<any, any>) {
    this.populate('references')
        .populate('created_by')
        .populate('task_responses');
}

function ensureObjectIdForUpdate(this: mongoose.Query<any, any>, next: mongoose.CallbackWithoutResultAndOptionalError) {
    const update = this.getUpdate() as any;
    if (update.references) {
        update.references = update.references.map((reference: any) => ensureObjectIdHelper(reference));
    }
    if (update.task_responses) {
        update.task_responses = update.task_responses.map((taskResponse: any) => ensureObjectIdHelper(taskResponse));
    }
    update.created_by = ensureObjectIdHelper(update.created_by);
    next();
}
messageSchema.pre('save', ensureObjectIdForMessage);
messageSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
messageSchema.pre('find', autoPopulateMessage);
messageSchema.pre('findOne', autoPopulateMessage);

const Message = mongoose.model<IMessageDocument>('Message', messageSchema);

export default Message;
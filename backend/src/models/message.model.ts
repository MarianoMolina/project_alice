import mongoose, { Schema } from 'mongoose';
import { IMessageDocument, IMessageModel, ContentType, RoleType, MessageGenerators } from '../interfaces/message.interface';
import { getObjectId } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { referencesSchema } from './reference.model';

const messageSchema = new Schema<IMessageDocument, IMessageModel>({
  content: { type: String, description: "Content of the message" },
  role: {
    type: String,
    enum: Object.values(RoleType),
    default: RoleType.USER,
    description: "Role of the message",
  },
  generated_by: {
    type: String,
    enum: Object.values(MessageGenerators),
    default: MessageGenerators.USER,
    description: "Source that generated the message",
  },
  step: { type: String, default: "", description: "Process that is creating this message" },
  assistant_name: { type: String, default: "", description: "Name of the assistant" },
  type: { 
    type: String, 
    enum: Object.values(ContentType),
    default: ContentType.TEXT, 
    description: "Type of the message" 
  },
  tool_calls: { type: Schema.Types.Mixed, default: [], description: "List of tool calls in the message" },
  tool_call_id: { type: String, default: null, description: "ID of the tool call, if any" },
  references: { type: referencesSchema, default: {}, description: "References associated with the message" },
  creation_metadata: {
    type: Schema.Types.Mixed,
    default: {},
    description: "Metadata about the creation of the message",
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    description: "User ID used to call the endpoint",
    autopopulate: true,
  },
  updated_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    description: "User ID used to update the endpoint",
    autopopulate: true,
  },
}, { timestamps: true });


messageSchema.methods.apiRepresentation = function (this: IMessageDocument) {
  return {
    id: this._id,
    content: this.content || null,
    role: this.role || RoleType.USER,
    generated_by: this.generated_by || MessageGenerators.USER,
    step: this.step || "",
    assistant_name: this.assistant_name || "",
    tool_calls: this.tool_calls || [],
    type: this.type || ContentType.TEXT,
    tool_call_id: this.tool_call_id || null,
    creation_metadata: this.creation_metadata || {},
    created_by: this.created_by ? (this.created_by._id || this.created_by) : null,
    updated_by: this.updated_by ? (this.updated_by._id || this.updated_by) : null,
    createdAt: this.createdAt || null,
    updatedAt: this.updatedAt || null,
    references: this.references || {},
  };
};

function ensureObjectIdForSave(
  this: IMessageDocument,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  if (this.references) {
    if (this.references.messages) {
      this.references.messages = this.references.messages.map(message => getObjectId(message));
    }
    if (this.references.files) {
      this.references.files = this.references.files.map(file => getObjectId(file));
    }
    if (this.references.task_responses) {
      this.references.task_responses = this.references.task_responses.map(taskResponse => getObjectId(taskResponse));
    }
    if (this.references.url_references) {
      this.references.url_references = this.references.url_references.map(searchResult => getObjectId(searchResult));
    }
  }
  this.created_by = getObjectId(this.created_by);
  this.updated_by = getObjectId(this.updated_by);
  next();
}

function ensureObjectIdForUpdate(
  this: mongoose.Query<any, any>,
  next: mongoose.CallbackWithoutResultAndOptionalError
) {
  const update = this.getUpdate() as any;
  if (update.references) {
    if (update.references.messages) {
      update.references.messages = update.references.messages.map((message: any) => getObjectId(message));
    }
    if (update.references.files) {
      update.references.files = update.references.files.map((file: any) => getObjectId(file));
    }
    if (update.references.task_responses) {
      update.references.task_responses = update.references.task_responses.map((taskResponse: any) => getObjectId(taskResponse));
    }
    if (update.references.url_references) {
      update.references.url_references = update.references.url_references.map((searchResult: any) => getObjectId(searchResult));
    }
  }
  update.created_by = getObjectId(update.created_by);
  update.updated_by = getObjectId(update.updated_by);
  next();
}

messageSchema.plugin(mongooseAutopopulate);
messageSchema.pre('save', ensureObjectIdForSave);
messageSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

const Message = mongoose.model<IMessageDocument, IMessageModel>('Message', messageSchema);

export default Message;
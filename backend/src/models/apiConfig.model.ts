import mongoose, { Schema } from 'mongoose';
import { IAPIConfigDocument, IAPIConfigModel } from '../interfaces/apiConfig.interface';
import { getObjectId } from '../utils/utils';
import mongooseAutopopulate from 'mongoose-autopopulate';
import { ApiName } from '../interfaces/api.interface';
import { encryptedDataPlugin } from '../utils/apiConfig.utils';
function validateApiData(data: any, api_name: ApiName): boolean {
  switch (api_name) {
      case ApiName.OPENAI:
      case ApiName.ANTHROPIC:
      case ApiName.GEMINI:
      case ApiName.MISTRAL:
      case ApiName.COHERE:
      case ApiName.LLAMA:
      case ApiName.AZURE:
      case ApiName.GROQ:
      case ApiName.DEEPSEEK:
      case ApiName.CUSTOM:
          return (
              typeof data.api_key === 'string' &&
              typeof data.base_url === 'string'
          );

      case ApiName.GOOGLE_SEARCH:
          return (
              typeof data.api_key === 'string' &&
              typeof data.cse_id === 'string'
          );

      case ApiName.REDDIT_SEARCH:
          return (
              typeof data.client_id === 'string' &&
              typeof data.client_secret === 'string'
          );

      case ApiName.WIKIPEDIA_SEARCH:
      case ApiName.ARXIV_SEARCH:
          return Object.keys(data).length === 0;

      case ApiName.EXA_SEARCH:
      case ApiName.GOOGLE_KNOWLEDGE_GRAPH:
          return typeof data.api_key === 'string';

      case ApiName.WOLFRAM_ALPHA:
          return typeof data.app_id === 'string';

      case ApiName.LM_STUDIO:
      case ApiName.BARK:
      case ApiName.PIXART_IMG_GEN:
          return typeof data.base_url === 'string';

      default:
          return false;
  }
}
// Create sub-schemas for each config type
const baseApiConfigSchema = new Schema({
  api_key: { type: String, required: true },
  base_url: { type: String, required: true }
}, { _id: false });

const googleSearchConfigSchema = new Schema({
  api_key: { type: String, required: true },
  cse_id: { type: String, required: true }
}, { _id: false });

const localApiConfigSchema = new Schema({
  base_url: { type: String, required: true }
}, { _id: false });

const redditConfigSchema = new Schema({
  client_id: { type: String, required: true },
  client_secret: { type: String, required: true }
}, { _id: false });

const wolframConfigSchema = new Schema({
  app_id: { type: String, required: true }
}, { _id: false });

const exaConfigSchema = new Schema({
  api_key: { type: String, required: true }
}, { _id: false });

const emptyConfigSchema = new Schema({}, { _id: false });

const apiConfigSchema = new Schema<IAPIConfigDocument, IAPIConfigModel>({
  name: { 
    type: String, 
    required: true, 
    description: "Name of the API configuration" 
  },
  api_name: { 
    type: String, 
    required: true, 
    enum: Object.values(ApiName),
    description: "Name of the API" 
  },
  data: { 
    type: Schema.Types.Mixed, 
    required: true, 
    description: "Data of the API configuration",
    validate: {
      validator: function(this: IAPIConfigDocument, value: any) {
        return validateApiData(value, this.api_name as ApiName);
      },
      message: 'Invalid data structure for the specified API'
    }
  },
  health_status: { type: String, enum: ['healthy', 'unhealthy', 'unknown'], default: 'unknown' },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

function ensureObjectId(this: IAPIConfigDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
  const context = { model: 'APIConfig', field: '' };
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
  const context = { model: 'APIConfig', field: '' };
  if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
  if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
  next();
}
apiConfigSchema.statics.getConfigSchema = function(apiName: ApiName) {
  switch (apiName) {
    case ApiName.OPENAI:
    case ApiName.ANTHROPIC:
    case ApiName.GEMINI:
    case ApiName.MISTRAL:
    case ApiName.COHERE:
    case ApiName.LLAMA:
    case ApiName.AZURE:
    case ApiName.GROQ:
    case ApiName.DEEPSEEK:
    case ApiName.CUSTOM:
      return baseApiConfigSchema;
    case ApiName.GOOGLE_SEARCH:
      return googleSearchConfigSchema;
    case ApiName.REDDIT_SEARCH:
      return redditConfigSchema;
    case ApiName.WIKIPEDIA_SEARCH:
    case ApiName.ARXIV_SEARCH:
      return emptyConfigSchema;
    case ApiName.EXA_SEARCH:
    case ApiName.GOOGLE_KNOWLEDGE_GRAPH:
      return exaConfigSchema;
    case ApiName.WOLFRAM_ALPHA:
      return wolframConfigSchema;
    case ApiName.LM_STUDIO:
    case ApiName.BARK:
    case ApiName.PIXART_IMG_GEN:
      return localApiConfigSchema;
    default:
      throw new Error(`Unknown API name: ${apiName}`);
  }
};
apiConfigSchema.plugin(encryptedDataPlugin, { fields: ['data'] });
apiConfigSchema.pre('save', ensureObjectId);
apiConfigSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);
apiConfigSchema.plugin(mongooseAutopopulate);

apiConfigSchema.methods.validateConfig = function() {
  return validateApiData(this.data, this.api_name);
};
const APIConfig = mongoose.model<IAPIConfigDocument, IAPIConfigModel>('APIConfig', apiConfigSchema);

export default APIConfig;

import mongoose, { Schema } from 'mongoose';
import {
    IStructuredStorageDocument,
    IStructuredStorageModel,
    StructureType,
    StructureDataType,
    ApiConfigMapsStructure
} from '../interfaces/structuredStorage.interface';
import { getObjectId } from '../utils/utils';
import { ApiName } from '../interfaces/api.interface';
import { ApiConfigType } from '../interfaces/apiConfig.interface';
import { encryptedDataPlugin } from '../utils/apiConfig.utils';

// Type guard for checking if an object is a valid ApiConfigType
const isApiConfigMap = (data: unknown): data is ApiConfigMapsStructure => {
    if (typeof data !== 'object' || data === null) return false;

    const obj = data as Record<string, ApiConfigType>;

    // Check each key-value pair in the object
    return Object.entries(obj).every(([key, apiConfig]) => {
        // Check if key is string and apiConfig is an object
        if (typeof key !== 'string' || typeof apiConfig !== 'object' || apiConfig === null) {
            return false;
        }

        // For each API config object, validate its structure based on api_name
        return Object.entries(apiConfig).every(([apiName, config]) => {
            // Validate that the apiName is valid
            if (!Object.values(ApiName).includes(apiName as ApiName)) {
                return false;
            }

            // Validate that config matches its expected type
            switch (apiName as ApiName) {
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
                    return 'api_key' in config && 'base_url' in config &&
                        typeof config.api_key === 'string' &&
                        typeof config.base_url === 'string';

                case ApiName.GOOGLE_SEARCH:
                    return 'api_key' in config && 'cse_id' in config &&
                        typeof config.api_key === 'string' &&
                        typeof config.cse_id === 'string';

                case ApiName.REDDIT_SEARCH:
                    return 'client_id' in config && 'client_secret' in config &&
                        typeof config.client_id === 'string' &&
                        typeof config.client_secret === 'string';

                case ApiName.WIKIPEDIA_SEARCH:
                case ApiName.ARXIV_SEARCH:
                    return Object.keys(config).length === 0;

                case ApiName.EXA_SEARCH:
                case ApiName.GOOGLE_KNOWLEDGE_GRAPH:
                    return 'api_key' in config &&
                        typeof config.api_key === 'string';

                case ApiName.WOLFRAM_ALPHA:
                    return 'app_id' in config &&
                        typeof config.app_id === 'string';

                case ApiName.LM_STUDIO:
                case ApiName.BARK:
                case ApiName.PIXART_IMG_GEN:
                    return 'base_url' in config &&
                        typeof config.base_url === 'string';

                default:
                    return false;
            }
        });
    });
};

// Validation functions for each structure type
const structureValidators: {
    [K in StructureType]: (data: unknown) => data is StructureDataType[K]
} = {
    [StructureType.API_CONFIG_MAPS]: isApiConfigMap
    // Add validators for other structure types here
};

const structuredStorageSchema = new Schema<IStructuredStorageDocument>({
    name: {
        type: String,
        required: true,
        unique: true,
        description: "Name of the structure"
    },
    type: {
        type: String,
        enum: Object.values(StructureType),
        required: true,
        description: "Type of the structure"
    },
    data: {
        type: Schema.Types.Mixed,
        required: true,
        validate: [{
            validator: function (this: IStructuredStorageDocument, value: unknown): boolean {
                const validatorFn = structureValidators[this.type];
                return validatorFn(value);
            },
            message: 'Invalid data structure for the specified type'
        }]
    },
    is_active: {
        type: Boolean,
        default: true,
        description: "Whether this structure is currently active"
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updated_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    strict: true
});

// Add methods
structuredStorageSchema.methods.validateData = function (this: IStructuredStorageDocument): boolean {
    const validatorFn = structureValidators[this.type];
    return validatorFn(this.data);
};

structuredStorageSchema.methods.getTypedData = function <T extends StructureType>(this: IStructuredStorageDocument) {
    return this.data as StructureDataType[T];
};

// Add static methods
structuredStorageSchema.statics.findByType = function (type: StructureType) {
    return this.find({ type });
};

structuredStorageSchema.statics.validateStructureData = function (type: StructureType, data: unknown): boolean {
    const validatorFn = structureValidators[type];
    return validatorFn(data);
};

// Pre-save middleware
function ensureObjectId(this: IStructuredStorageDocument, next: mongoose.CallbackWithoutResultAndOptionalError) {
    const context = { model: 'StructuredStorage', field: '' };
    if (this.created_by) this.created_by = getObjectId(this.created_by, { ...context, field: 'created_by' });
    if (this.updated_by) this.updated_by = getObjectId(this.updated_by, { ...context, field: 'updated_by' });
    next();
}

// Pre-update middleware
function ensureObjectIdForUpdate(
    this: mongoose.Query<any, any>,
    next: mongoose.CallbackWithoutResultAndOptionalError
) {
    const update = this.getUpdate() as any;
    if (!update) return next();

    const context = { model: 'StructuredStorage', field: '' };
    if (update.created_by) update.created_by = getObjectId(update.created_by, { ...context, field: 'created_by' });
    if (update.updated_by) update.updated_by = getObjectId(update.updated_by, { ...context, field: 'updated_by' });
    next();
}
structuredStorageSchema.plugin(encryptedDataPlugin, { fields: ['data'] });
structuredStorageSchema.pre('save', ensureObjectId);
structuredStorageSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

// Type assertion for model creation
const StructuredStorage = mongoose.model<IStructuredStorageDocument, IStructuredStorageModel>(
    'StructuredStorage',
    structuredStorageSchema
);

export default StructuredStorage;
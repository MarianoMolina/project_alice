
import mongoose, { Schema } from 'mongoose';
import {
    IStructuredStorageDocument,
    IStructuredStorageModel,
    StructureType,
    StructureDataType
} from '../interfaces/structuredStorage.interface';
import { getObjectId } from '../utils/utils';
import { validateApiConfigMap } from '../utils/api.utils';
import { EncryptionService } from '../utils/encrypt.utils';

const structureValidators: {
    [K in StructureType]: (data: unknown) => data is StructureDataType[K]
} = {
    [StructureType.API_CONFIG_MAPS]: validateApiConfigMap
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
        }],
        set: function(this: IStructuredStorageDocument & {type: StructureType}, data: unknown) {
            if (!data) return data;
            // Now properly typed
            const validatorFn = structureValidators[this.type];
            if (!validatorFn(data)) {
                throw new Error('Invalid data structure for the specified type');
            }
            const stringData = typeof data === 'string' ? data : JSON.stringify(data);
            return EncryptionService.getInstance().encrypt(stringData);
        },
        get: function(encryptedData: string) {
            if (!encryptedData) return encryptedData;
            const decrypted = EncryptionService.getInstance().decrypt(encryptedData);
            try {
                return JSON.parse(decrypted);
            } catch {
                return decrypted;
            }
        }
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
    strict: true,
    toJSON: { getters: true },
    toObject: { getters: true }
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
structuredStorageSchema.pre('save', ensureObjectId);
structuredStorageSchema.pre('findOneAndUpdate', ensureObjectIdForUpdate);

// Type assertion for model creation
const StructuredStorage = mongoose.model<IStructuredStorageDocument, IStructuredStorageModel>(
    'StructuredStorage',
    structuredStorageSchema
);

export default StructuredStorage;
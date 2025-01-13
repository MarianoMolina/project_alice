import { Schema, Document } from 'mongoose';
import { EncryptionService } from './encrypt.utils';

// Interface for documents with encryption
interface EncryptableDocument extends Document {
    _encrypted?: boolean;
    [key: string]: any;
}

export const encryptedDataPlugin = (schema: Schema, options: { fields: string[] }) => {
    const encryptionService = EncryptionService.getInstance();

    // Add encrypted flag to track encryption status
    schema.add({
        _encrypted: { type: Boolean, default: false, select: false }
    });

    // Pre-save middleware with proper typing
    schema.pre('save', function (this: EncryptableDocument, next) {
        if (this._encrypted) return next();

        options.fields.forEach(field => {
            if (this[field]) {
                // Convert to string since our encryption service expects string input
                const stringData = typeof this[field] === 'string'
                    ? this[field]
                    : JSON.stringify(this[field]);

                this[field] = encryptionService.encrypt(stringData);
            }
        });
        this._encrypted = true;
        next();
    });

    // Post-find middleware with proper typing
    schema.post(['find', 'findOne'], function (docs: EncryptableDocument | EncryptableDocument[], next) {
        if (!docs) return next();

        const processDoc = (doc: EncryptableDocument) => {
            if (!doc._encrypted) return;

            options.fields.forEach(field => {
                if (doc[field]) {
                    try {
                        const decrypted = encryptionService.decrypt(doc[field]);
                        // Try to parse JSON if the original data was an object
                        try {
                            doc[field] = JSON.parse(decrypted);
                        } catch {
                            // If parsing fails, assume it was a string
                            doc[field] = decrypted;
                        }
                    } catch (error) {
                        console.error(`Failed to decrypt ${field}:`, error);
                    }
                }
            });
        };

        if (Array.isArray(docs)) {
            docs.forEach(processDoc);
        } else {
            processDoc(docs);
        }
        next();
    });

    // Add method to check if data is encrypted
    schema.methods.isEncrypted = function (this: EncryptableDocument) {
        return this._encrypted;
    };
};
import mongoose, { Model, Document, Types } from 'mongoose';
import { Embeddable } from '../interfaces/embeddingChunk.interface';
import Logger from './logger';
import { DataClusterHolder, IDataClusterDocument, References } from '../interfaces/references.interface';

export const ReferenceTypeModelMap: Record<keyof References, string> = {
    messages: 'Message',
    files: 'FileReference',
    task_responses: 'TaskResult',
    entity_references: 'EntityReference',
    user_interactions: 'UserInteraction',
    embeddings: 'EmbeddingChunk',
    tool_calls: 'ToolCall',
    code_executions: 'CodeExecution'
};

interface DocumentWithId extends Document {
    _id: string | Types.ObjectId;
}

export interface PopulationConfig {
    embeddable: boolean;
    hasDataCluster: boolean;
    hasReferences: boolean;
    hasTasks: boolean;
    hasMessages: boolean;
    referencePath?: string[];
    taskPath?: string[];
}

export const defaultPopulationConfig: PopulationConfig = {
    embeddable: false,
    hasDataCluster: false,
    hasReferences: false,
    hasTasks: false,
    hasMessages: false,
};

export const ReferencePopulationConfig: PopulationConfig = {
    ...defaultPopulationConfig,
    embeddable: true,
};

export const ModelPopulationMap: Record<string, PopulationConfig> = {
    'CodeExecution': ReferencePopulationConfig,
    'EntityReference': ReferencePopulationConfig,
    'FileReference': ReferencePopulationConfig,
    'Message': {
        ...ReferencePopulationConfig,
        hasReferences: true,
    },
    'Task': {
        ...defaultPopulationConfig,
        hasDataCluster: true,
        hasTasks: true
    },
    'TaskResult': {
        ...ReferencePopulationConfig,
        hasReferences: true,
        referencePath: ['node_references.references'],
    },
    'ToolCall': ReferencePopulationConfig,
    'UserInteraction': ReferencePopulationConfig,
    'AliceChat': {
        ...defaultPopulationConfig,
        hasDataCluster: true,
        hasReferences: true,
        hasTasks: true,
        taskPath: ['agent_tools', 'retrieval_tools'],
        hasMessages: true,
    }
};

export class PopulationService {
    private populatedReferences: Map<string, any>;

    constructor() {
        this.populatedReferences = new Map();
    }

    async findAndPopulate<T extends Document>(
        model: Model<T>,
        id: string | Types.ObjectId,
        userId: string | Types.ObjectId,
    ): Promise<T | null> {
        const memoKey = `${model.modelName}-${id}`;
        if (this.populatedReferences.has(memoKey)) {
            return this.populatedReferences.get(memoKey);
        }

        const doc = await model.findOne({
            _id: id,
            created_by: userId
        });

        if (!doc) return null;

        const config = ModelPopulationMap[model.modelName];
        if (!config) {
            return doc;
        }

        this.populatedReferences.set(memoKey, doc);

        let populatedDoc = doc;

        if (config.embeddable && this.isEmbeddable(populatedDoc)) {
            const embeddableDoc = await this.populateEmbeddable(populatedDoc, userId);
            populatedDoc = embeddableDoc as typeof populatedDoc;
            this.populatedReferences.set(memoKey, populatedDoc);
        }

        if (config.hasReferences && this.hasReferences(populatedDoc, config)) {
            populatedDoc = await this.populateReferences(populatedDoc, config, userId);
            this.populatedReferences.set(memoKey, populatedDoc);
        }

        if (config.hasDataCluster && this.hasDataCluster(populatedDoc)) {
            populatedDoc = await this.populateDataCluster(populatedDoc, userId);
            this.populatedReferences.set(memoKey, populatedDoc);
        }

        if (config.hasTasks && this.hasTasks(populatedDoc, config)) {
            populatedDoc = await this.populateTasks(populatedDoc, config, userId);
            this.populatedReferences.set(memoKey, populatedDoc);
        }
        if (config.hasMessages && this.hasMessages(populatedDoc)) {
            populatedDoc = await this.populateMessages(populatedDoc, userId);
            this.populatedReferences.set(memoKey, populatedDoc);
        }

        this.populatedReferences.set(memoKey, populatedDoc);
        return populatedDoc as T;
    }

    private hasMessages(doc: any): doc is Document & { messages: (Types.ObjectId | DocumentWithId)[] } {
        return 'messages' in doc && Array.isArray(doc.messages);
    }

    private async populateMessages<T extends Document>(
        doc: T & { messages: (Types.ObjectId | DocumentWithId)[] },
        userId: string | Types.ObjectId
    ): Promise<T & { messages: Document[] }> {
        const docObj = doc.toObject();

        if (!docObj.messages || !Array.isArray(docObj.messages)) {
            return docObj as T & { messages: Document[] };
        }

        const MessageModel = mongoose.model('Message');
        docObj.messages = await Promise.all(
            docObj.messages.map(async (messageId: Types.ObjectId | DocumentWithId) => {
                const messageObjectId: Types.ObjectId | string = messageId instanceof Document
                    ? messageId._id
                    : messageId;

                const populatedMessage = await this.findAndPopulate(
                    MessageModel,
                    messageObjectId,
                    userId
                );
                return populatedMessage || messageId;
            })
        );

        return docObj as T & { messages: Document[] };
    }
    private isEmbeddable(doc: any): doc is Document & Embeddable {
        return 'embedding' in doc;
    }

    private async populateEmbeddable<T extends Document>(
        doc: Document & Embeddable,
        userId: string | Types.ObjectId
    ): Promise<Document & Embeddable> {
        if (!doc.embedding) return doc;

        return {
            ...doc.toObject(),
            embedding: await this.populateReferenceStructure(doc.embedding, mongoose.model('EmbeddingChunk'), userId)
        };
    }

    private async populateReferenceStructure<T extends Document>(
        reference: string | Types.ObjectId | DocumentWithId | (string | Types.ObjectId | DocumentWithId)[] | Record<string, string | Types.ObjectId | DocumentWithId>,
        model: Model<T>,
        userId: string | Types.ObjectId
    ): Promise<any> {
        if (Array.isArray(reference)) {
            return Promise.all(
                reference.map(ref => {
                    const refId = (ref instanceof Document) ? ref._id : ref as string | Types.ObjectId;
                    return this.findAndPopulate(model, refId, userId);
                })
            );
        }

        if (reference instanceof Document) {
            const refId = reference._id as string | Types.ObjectId;
            return this.findAndPopulate(model, refId, userId);
        }

        if (typeof reference === 'string' || reference instanceof Types.ObjectId) {
            return this.findAndPopulate(model, reference, userId);
        }

        if (typeof reference === 'object') {
            const result: Record<string, any> = {};
            for (const [key, value] of Object.entries(reference)) {
                const refId = value instanceof Document
                    ? value._id as string | Types.ObjectId
                    : value as string | Types.ObjectId;
                result[key] = await this.findAndPopulate(model, refId, userId);
            }
            return result;
        }

        Logger.warn('Invalid reference structure', { reference, model, userId });

        return reference;
    }

    private hasTasks(doc: any, config: PopulationConfig): boolean {
        // Check default "tasks" field
        if ('tasks' in doc && doc.tasks) {
            return true;
        }

        // Check custom task paths if provided
        if (config.taskPath) {
            return config.taskPath.some(path => {
                const value = path.split('.').reduce((obj, key) => obj && obj[key], doc);
                return value !== undefined && value !== null;
            });
        }

        return false;
    }

    private async populateTasks<T extends Document>(
        doc: T,
        config: PopulationConfig,
        userId: string | Types.ObjectId
    ): Promise<T> {
        const TaskModel = mongoose.model('Task');
        const docObj = doc.toObject();

        // Handle default tasks field
        if ('tasks' in docObj && docObj.tasks) {
            docObj.tasks = await this.populateReferenceStructure(
                docObj.tasks,
                TaskModel,
                userId
            );
        }

        // Handle custom task paths
        if (config.taskPath) {
            for (const path of config.taskPath) {
                const pathParts = path.split('.');
                const lastPart = pathParts.pop()!;

                // Navigate to the parent object of the tasks
                let target = pathParts.reduce((obj, key) => obj && obj[key], docObj);

                if (target && target[lastPart]) {
                    target[lastPart] = await this.populateReferenceStructure(
                        target[lastPart],
                        TaskModel,
                        userId
                    );
                }
            }
        }

        return docObj as T;
    }

    private hasReferences(doc: any, config: PopulationConfig): boolean {
        // Check if doc is a ReferenceHolder
        if ('references' in doc && doc.references) {
            return true;
        }

        // If there's a custom reference path, check that
        if (config.referencePath) {
            return config.referencePath.some(path => {
                const value = path.split('.').reduce((obj, key) => obj && obj[key], doc);
                return value !== undefined && value !== null;
            });
        }

        return false;
    }

    // Function to populate a References object
    private populateReferencesObject = async (references: References, userId: string | Types.ObjectId): Promise<References> => {
        const populatedRefs: References = {};

        // Map of reference types to their corresponding models
        const referenceTypeToModel: Record<keyof References, string> = {
            messages: 'Message',
            files: 'FileReference',
            task_responses: 'TaskResult',
            entity_references: 'EntityReference',
            user_interactions: 'UserInteraction',
            embeddings: 'EmbeddingChunk',
            tool_calls: 'ToolCall',
            code_executions: 'CodeExecution'
        };

        // Populate each reference type if it exists
        for (const [refType, modelName] of Object.entries(referenceTypeToModel)) {
            if (references[refType as keyof References]) {
                const Model = mongoose.model(modelName);
                populatedRefs[refType as keyof References] = await this.populateReferenceStructure(
                    references[refType as keyof References]!,
                    Model,
                    userId
                );
            }
        }

        return populatedRefs;
    };

    private async populateReferences<T extends Document>(
        doc: T,
        config: PopulationConfig,
        userId: string | Types.ObjectId
    ): Promise<T> {
        const docObj = doc.toObject();

        // Handle default references field
        if ('references' in docObj && docObj.references) {
            docObj.references = await this.populateReferencesObject(docObj.references, userId);
        }

        // Handle custom reference paths
        if (config.referencePath) {
            for (const path of config.referencePath) {
                const pathParts = path.split('.');

                // Navigate through the path
                let current = docObj;
                for (let i = 0; i < pathParts.length; i++) {
                    const part = pathParts[i];

                    if (!current[part]) break;

                    // If we're at node_references and it's an array
                    if (Array.isArray(current[part])) {
                        // Handle array of objects with references
                        current[part] = await Promise.all(
                            current[part].map(async (item: any) => {
                                // If this is the final part, populate the entire item
                                if (i === pathParts.length - 1) {
                                    return await this.populateReferencesObject(item, userId);
                                }
                                // Otherwise, continue navigating through the remaining path
                                const remainingPath = pathParts.slice(i + 1);
                                let target = item;
                                for (const nextPart of remainingPath) {
                                    if (!target[nextPart]) break;
                                    if (i === pathParts.length - 2 && nextPart === pathParts[pathParts.length - 1]) {
                                        target[nextPart] = await this.populateReferencesObject(target[nextPart], userId);
                                    }
                                    target = target[nextPart];
                                }
                                return item;
                            })
                        );
                        break; // Break since we've handled the remaining path in the map function
                    }

                    // If we're at the final part and it's an object
                    if (i === pathParts.length - 1 && typeof current[part] === 'object') {
                        current[part] = await this.populateReferencesObject(current[part], userId);
                    }

                    current = current[part];
                }
            }
        }

        return docObj as T;
    }
    private hasDataCluster(doc: any): doc is Document & DataClusterHolder {
        return 'data_cluster' in doc && doc.data_cluster;
    }

    private async populateDataCluster<T extends Document>(
        doc: T & DataClusterHolder,
        userId: string | Types.ObjectId
    ): Promise<T & DataClusterHolder> {
        const docObj = doc.toObject();

        if (!docObj.data_cluster) {
            return docObj as T & DataClusterHolder;
        }

        // The data cluster is already populated due to autopopulate
        let dataCluster = docObj.data_cluster as IDataClusterDocument;

        // Create a References object from the data cluster fields
        const references: References = {
            messages: dataCluster.messages || [],
            files: dataCluster.files || [],
            task_responses: dataCluster.task_responses || [],
            entity_references: dataCluster.entity_references || [],
            user_interactions: dataCluster.user_interactions || [],
            embeddings: dataCluster.embeddings || [],
            tool_calls: dataCluster.tool_calls || [],
            code_executions: dataCluster.code_executions || []
        };

        // Populate all references within the data cluster
        const populatedReferences = await this.populateReferencesObject(references, userId);

        // Instead of creating a new object, update the existing document
        if (dataCluster.set) {
            dataCluster.set({
                messages: populatedReferences.messages || [],
                files: populatedReferences.files || [],
                task_responses: populatedReferences.task_responses || [],
                entity_references: populatedReferences.entity_references || [],
                user_interactions: populatedReferences.user_interactions || [],
                embeddings: populatedReferences.embeddings || [],
                tool_calls: populatedReferences.tool_calls || [],
                code_executions: populatedReferences.code_executions || []
            });
        }

        docObj.data_cluster = dataCluster;
        return docObj as T & DataClusterHolder;
    }
    clearCache(): void {
        this.populatedReferences.clear();
    }
}
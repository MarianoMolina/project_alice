import mongoose, { Model, Document, Types } from 'mongoose';
import { Embeddable } from '../interfaces/embeddingChunk.interface';
import { DataClusterHolder, References } from '../interfaces/references.interface';
import Logger from './logger';

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
            return this.populatedReferences.get(memoKey) as T;
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
        // Work with a plain object for populations
        let populatedObj = doc.toJSON();
        this.populatedReferences.set(memoKey, populatedObj as T);

        if (config.embeddable && this.isEmbeddable(doc)) {
            populatedObj = await this.populateEmbeddable(populatedObj, userId);
        }
        if (config.hasReferences && this.hasReferences(doc, config)) {
            populatedObj = await this.populateReferences(populatedObj, config, userId);
        }
        if (config.hasDataCluster && this.hasDataCluster(doc)) {
            populatedObj = await this.populateDataCluster(populatedObj, userId);
        }
        if (config.hasTasks && this.hasTasks(doc, config)) {
            populatedObj = await this.populateTasks(populatedObj, config, userId);
        }
        if (config.hasMessages && this.hasMessages(doc)) {
            populatedObj = await this.populateMessages(populatedObj, userId);
        }
        this.populatedReferences.set(memoKey, populatedObj as T);
        return populatedObj as T;
    }

    private isEmbeddable(doc: Document): doc is Document & Embeddable {
        return (
            'embedding' in doc
        );
    }

    private hasMessages(doc: Document): boolean {
        Logger.debug('Checking for messages in doc:', doc);
        Logger.debug('Messages:', 'messages' in doc, 'messages' in doc && Array.isArray(doc.messages));
        return (
            'messages' in doc &&
            Array.isArray(doc.messages)
        );
    }

    private hasDataCluster(doc: Document): doc is Document & DataClusterHolder {
        return (
            'data_cluster' in doc &&
            doc.data_cluster !== null
        );
    }

    private hasReferences(doc: Document, config: PopulationConfig): boolean {
        // Check if doc has 'references' field
        if ('references' in doc && doc.references) {
            return true;
        }

        // Check custom reference paths
        if (config.referencePath) {
            return config.referencePath.some(path => {
                const value = path.split('.').reduce((obj: any, key) => obj && obj[key], doc);
                return value !== undefined && value !== null;
            });
        }

        return false;
    }

    private hasTasks(doc: Document, config: PopulationConfig): boolean {
        // Check default "tasks" field
        if ('tasks' in doc && doc.tasks) {
            return true;
        }

        // Check custom task paths
        if (config.taskPath) {
            return config.taskPath.some(path => {
                const value = path.split('.').reduce((obj: any, key) => obj && obj[key], doc);
                return value !== undefined && value !== null;
            });
        }

        return false;
    }

    private async populateMessages(
        obj: any,
        userId: string | Types.ObjectId
    ): Promise<any> {
        if (!obj.messages || !Array.isArray(obj.messages)) {
            return obj;
        }

        const MessageModel = mongoose.model('Message');
        const populatedMessages = await Promise.all(
            obj.messages.map(async (messageId: string | Types.ObjectId) => {
                const populatedMessage = await this.findAndPopulate(
                    MessageModel,
                    messageId,
                    userId
                );
                return populatedMessage || messageId;
            })
        );

        return {
            ...obj,
            messages: populatedMessages
        };
    }

    private async populateEmbeddable(
        obj: any,
        userId: string | Types.ObjectId
    ): Promise<any> {
        if (!obj.embedding) return obj;

        return {
            ...obj,
            embedding: await this.populateReferenceStructure(
                obj.embedding,
                mongoose.model('EmbeddingChunk'),
                userId
            )
        };
    }

    private async populateDataCluster(
        obj: any,
        userId: string | Types.ObjectId
    ): Promise<any> {
        if (!obj.data_cluster) return obj;

        const references: References = {
            messages: obj.data_cluster.messages || [],
            files: obj.data_cluster.files || [],
            task_responses: obj.data_cluster.task_responses || [],
            entity_references: obj.data_cluster.entity_references || [],
            user_interactions: obj.data_cluster.user_interactions || [],
            embeddings: obj.data_cluster.embeddings || [],
            tool_calls: obj.data_cluster.tool_calls || [],
            code_executions: obj.data_cluster.code_executions || []
        };

        const populatedReferences = await this.populateReferencesObject(references, userId);

        return {
            ...obj,
            data_cluster: {
                ...obj.data_cluster,
                ...populatedReferences
            }
        };
    }

    private async populateReferences(
        obj: any,
        config: PopulationConfig,
        userId: string | Types.ObjectId
    ): Promise<any> {
        if ('references' in obj && obj.references) {
            obj.references = await this.populateReferencesObject(obj.references, userId);
        }

        if (config.referencePath) {
            for (const path of config.referencePath) {
                const pathParts = path.split('.');
                let current = obj;

                for (let i = 0; i < pathParts.length; i++) {
                    const part = pathParts[i];
                    if (!current[part]) break;

                    if (Array.isArray(current[part])) {
                        current[part] = await Promise.all(
                            current[part].map(async (item: any) => {
                                if (i === pathParts.length - 1) {
                                    return await this.populateReferencesObject(item, userId);
                                }
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
                        break;
                    }

                    if (i === pathParts.length - 1 && typeof current[part] === 'object') {
                        current[part] = await this.populateReferencesObject(current[part], userId);
                    }

                    current = current[part];
                }
            }
        }

        return obj;
    }

    private async populateTasks(
        obj: any,
        config: PopulationConfig,
        userId: string | Types.ObjectId
    ): Promise<any> {
        const TaskModel = mongoose.model('Task');

        if ('tasks' in obj && obj.tasks) {
            obj.tasks = await this.populateReferenceStructure(
                obj.tasks,
                TaskModel,
                userId
            );
        }

        if (config.taskPath) {
            for (const path of config.taskPath) {
                const pathParts = path.split('.');
                const lastPart = pathParts.pop()!;
                let target = pathParts.reduce((obj, key) => obj && obj[key], obj);

                if (target && target[lastPart]) {
                    target[lastPart] = await this.populateReferenceStructure(
                        target[lastPart],
                        TaskModel,
                        userId
                    );
                }
            }
        }

        return obj;
    }

    private async populateReferenceStructure(
        reference: Record<string, any> | any[] | any,
        model: Model<any>,
        userId: string | Types.ObjectId
    ): Promise<any> {
        if (Array.isArray(reference)) {
            return Promise.all(
                reference.map(ref => this.findAndPopulate(model, ref, userId))
            );
        }
    
        if (typeof reference === 'object' && reference !== null) {
            const result: Record<string, any> = {};
            for (const [key, value] of Object.entries(reference as Record<string, any>)) {
                const refId = (value as any)?._id || value;
                result[key] = await this.findAndPopulate(model, refId, userId);
            }
            return result;
        }
    
        return this.findAndPopulate(model, reference, userId);
    }

    private async populateReferencesObject(references: References, userId: string | Types.ObjectId): Promise<References> {
        const populatedRefs: References = {};

        for (const [refType, modelName] of Object.entries(ReferenceTypeModelMap)) {
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
    }

    clearCache(): void {
        this.populatedReferences.clear();
    }
}
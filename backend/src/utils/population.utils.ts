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
    isDataCluster: boolean;
    hasTasks: boolean;
    hasMessages: boolean;
    referencePath?: string[];
    taskPath?: string[];
}

export const defaultPopulationConfig: PopulationConfig = {
    embeddable: false,
    hasDataCluster: false,
    isDataCluster: false,
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
        hasTasks: true,
        taskPath: ['agent_tools', 'retrieval_tools'],
        hasMessages: true,
    },
    'DataCluster': {
        ...defaultPopulationConfig,
        isDataCluster: true,
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
        Logger.debug('Starting findAndPopulate:', {
            modelName: model.modelName,
            id,
            memoKey: `${model.modelName}-${id}`
        });
        const config = ModelPopulationMap[model.modelName];
        Logger.debug('Population config:', {
            modelName: model.modelName,
            config
        });
        if (this.populatedReferences.has(memoKey)) {
            return this.populatedReferences.get(memoKey) as T;
        }
        const doc = await model.findOne({
            _id: id,
            created_by: userId
        });
        if (!doc) return null;
        Logger.debug('Document found:', {
            modelName: model.modelName,
            id,
            hasDoc: !!doc,
            hasReferences: config?.hasReferences,
            hasRefPath: !!config?.referencePath
        });
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
            Logger.info('Populating references for:', populatedObj);
            populatedObj = await this.populateReferences(populatedObj, config, userId);
            Logger.info('Populated references:', populatedObj);
        }
        if (config.isDataCluster && this.isReferencesObject(doc)) {
            const referencesObj = await this.populateReferencesObject(populatedObj as References, userId) as mongoose.FlattenMaps<mongoose.Require_id<T>>;
            populatedObj = {
                ...populatedObj,
                ...referencesObj
            }
        }
        if (config.hasDataCluster && this.hasDataCluster(doc)) {
            populatedObj = await this.populateDataCluster(populatedObj, userId);
        }
        if (config.hasTasks && this.hasTasks(doc, config)) {
            populatedObj = await this.populateTasks(populatedObj, config, userId);
        }
        if (config.hasMessages && this.hasMessages(doc)) {
            Logger.debug('Will populate references:', {
                modelName: model.modelName,
                id,
                refPath: config.referencePath,
                // Check for references safely
                hasDirectRefs: doc.toJSON().hasOwnProperty('references')
            });
            populatedObj = await this.populateMessages(populatedObj, userId);
            Logger.debug('After reference population:', {
                modelName: model.modelName,
                id,
                populatedKeys: Object.keys(populatedObj)
            });
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
        Logger.info('Checking for messages in doc:', doc);
        Logger.info('Messages:', 'messages' in doc, 'messages' in doc && Array.isArray(doc.messages));
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

    private isReferencesObject(obj: any): obj is References {
        if (!obj || typeof obj !== 'object') return false;
        
        // Check if the object has any of the reference type keys
        const referenceKeys = Object.keys(ReferenceTypeModelMap);
        return referenceKeys.some(key => key in obj);
    }

    private hasReferences(doc: Document, config: PopulationConfig): boolean {
        Logger.debug('hasReferences check starting for doc:', {
            id: doc._id,
            hasDirectRefs: 'references' in doc,
            configPath: config.referencePath
        });

        if (this.isReferencesObject(doc)) {
            Logger.debug('Document is a References object, skipping population');
            return true;
        }

        // Check if doc has 'references' field
        if ('references' in doc && doc.references) {
            Logger.debug('Found direct references in doc');
            return true;
        }

        // Check custom reference paths
        if (config.referencePath) {
            const hasRefs = config.referencePath.some(path => {
                Logger.debug('Checking reference path:', path);
                const parts = path.split('.');
                let current: any = doc;

                for (const part of parts) {
                    Logger.debug('Checking path part:', {
                        part,
                        currentType: Array.isArray(current) ? 'array' : typeof current,
                        hasPartProperty: current && part in current,
                        value: current && current[part]
                    });

                    if (!current) {
                        Logger.debug('Current object is null/undefined, path check failed');
                        return false;
                    }

                    if (Array.isArray(current)) {
                        const arrayHasRefs = current.some(item => {
                            let subCurrent = item;
                            Logger.debug('Checking array item:', {
                                itemId: item._id,
                                remainingPath: parts.slice(parts.indexOf(part) + 1)
                            });

                            for (const remainingPart of parts.slice(parts.indexOf(part) + 1)) {
                                if (!subCurrent || !subCurrent[remainingPart]) {
                                    Logger.debug('Array item missing required path:', remainingPart);
                                    return false;
                                }
                                subCurrent = subCurrent[remainingPart];
                            }
                            Logger.debug('Found valid references in array item');
                            return true;
                        });

                        Logger.debug('Array check result:', { arrayHasRefs });
                        return arrayHasRefs;
                    }

                    current = current[part];
                }

                const pathHasRefs = current !== undefined && current !== null;
                Logger.debug('Path check result:', { path, hasRefs: pathHasRefs });
                return pathHasRefs;
            });

            Logger.debug('Final reference check result:', { hasRefs });
            return hasRefs;
        }

        Logger.debug('No references found');
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

        // If data_cluster is a string or ObjectId, it's a reference we need to resolve
        if (typeof obj.data_cluster === 'string' || obj.data_cluster instanceof Types.ObjectId) {
            const DataClusterModel = mongoose.model('DataCluster');
            const dataCluster = await this.findAndPopulate(
                DataClusterModel,
                obj.data_cluster,
                userId
            );
            
            if (!dataCluster) {
                Logger.warn('Data cluster not found:', {
                    dataClusterId: obj.data_cluster,
                    parentId: obj._id
                });
                return obj;
            }

            return {
                ...obj,
                data_cluster: dataCluster
            };
        }

        // If it's an embedded data cluster (object), populate its references
        if (typeof obj.data_cluster === 'object' && obj.data_cluster !== null) {
            const references = await this.populateReferences(obj.data_cluster, defaultPopulationConfig, userId);
            return {
                ...obj,
                data_cluster: {
                    ...obj.data_cluster,
                    ...references
                }
            };
        }

        // If we don't recognize the format, log a warning and return unchanged
        Logger.warn('Unrecognized data cluster format:', {
            type: typeof obj.data_cluster,
            parentId: obj._id
        });
        return obj;
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
                let parent = null;
                let lastPart = '';

                // Track the parent as we traverse
                for (let i = 0; i < pathParts.length; i++) {
                    const part = pathParts[i];

                    if (Array.isArray(current) && i === pathParts.length - 1) {
                        // Update the parent's reference to the array
                        parent[lastPart] = await Promise.all(
                            current.map(async (item) => {
                                if (item[part]) {
                                    return {
                                        ...item,
                                        [part]: await this.populateReferencesObject(item[part], userId)
                                    };
                                }
                                return item;
                            })
                        );
                        break;
                    }

                    if (!current || !current[part]) break;

                    if (i === pathParts.length - 1) {
                        // Update the parent's reference
                        parent[lastPart] = await this.populateReferencesObject(current[part], userId);
                    } else {
                        // Track parent before moving deeper
                        parent = current;
                        lastPart = part;
                        current = current[part];
                    }
                }
            }
        }
        if (this.isReferencesObject(obj)) {
            obj = await this.populateReferencesObject(obj, userId);
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
        Logger.debug('Starting populateReferenceStructure:', {
            isArray: Array.isArray(reference),
            modelName: model.modelName,
            referenceType: typeof reference
        });
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

        const result = this.findAndPopulate(model, reference, userId);
        return result
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
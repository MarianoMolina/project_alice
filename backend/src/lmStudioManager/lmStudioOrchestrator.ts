import { DownloadedModel, EmbeddingLoadModelConfig, LLMLoadModelConfig } from "@lmstudio/sdk";
import { LMStudioClientManager } from "./lmStudioClientManager";
import { Queue } from "./queueManager";
import Logger from "../utils/logger";
import { ChatCompletionParams, CompletionParams } from "./lmStudio.types";
import { CreateEmbeddingParams } from "./lmStudio.utils";
import { IModelConfig, ModelType } from "../interfaces/model.interface";
import { Model } from "mongoose";

interface ExtendedDownloadedModel extends DownloadedModel {
    isLoaded: boolean;
}

export class LMStudioRouteManager {
    private lmStudioManager: LMStudioClientManager;
    private requestQueue: Queue;
    private cleanupInterval: NodeJS.Timeout | null;
    private isInitialized: boolean;
    private readonly CLEANUP_INTERVAL = 3 * 60 * 1000; // 3 minutes
    private readonly INACTIVITY_THRESHOLD = 10 * 60 * 1000; // 10 minutes

    constructor() {
        this.lmStudioManager = new LMStudioClientManager(this.INACTIVITY_THRESHOLD);
        this.requestQueue = new Queue({
            maxQueueSize: 100,
            operationTimeout: 300000, // 5 minutes
            retryCount: 2,
            retryDelay: 2000
        });
        this.cleanupInterval = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the LMStudioRouteManager
     * Queues initial cleanup and sets up periodic cleanup
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            Logger.warn('LMStudioRouteManager is already initialized');
            return;
        }

        try {
            Logger.info('Initializing LMStudioRouteManager');
            
            // Queue initial cleanup
            await this.requestQueue.enqueue(
                async () => {
                    Logger.info('Performing initial cleanup');
                    await this.lmStudioManager.unloadAllModels();
                },
                'initialize-cleanup'
            );
            
            // Set up periodic cleanup
            this.cleanupInterval = setInterval(() => {
                // Queue periodic cleanup
                this.requestQueue.enqueue(
                    async () => {
                        Logger.info('Performing periodic inactive model cleanup');
                        await this.lmStudioManager.unloadInactiveModels();
                    },
                    'periodic-cleanup'
                ).catch(error => Logger.error('Error in periodic cleanup:', error));
            }, this.CLEANUP_INTERVAL);

            // Set up shutdown handlers
            this.setupShutdownHandlers();
            
            this.isInitialized = true;
            Logger.info('LMStudioRouteManager initialized successfully');
        } catch (error) {
            Logger.error('Error initializing LMStudioRouteManager:', error);
            throw error;
        }
    }

    /**
     * Set up handlers for various shutdown signals
     */
    private setupShutdownHandlers(): void {
        const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
        
        signals.forEach(signal => {
            process.on(signal, async () => {
                Logger.info(`Received ${signal}, initiating graceful shutdown`);
                await this.shutdown();
                process.exit(0);
            });
        });

        // Handle nodemon restarts
        process.on('beforeExit', async () => {
            Logger.info('Process beforeExit, initiating cleanup');
            await this.shutdown();
        });
    }

    /**
     * Gracefully shutdown the manager
     * Queues final cleanup operations
     */
    async shutdown(): Promise<void> {
        Logger.info('Starting LMStudioRouteManager shutdown');
        
        try {
            // Clear cleanup interval
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
                this.cleanupInterval = null;
            }

            // Queue final cleanup
            await this.requestQueue.enqueue(
                async () => {
                    Logger.info('Performing final cleanup');
                    await this.lmStudioManager.unloadAllModels();
                },
                'shutdown-cleanup'
            );
            
            this.isInitialized = false;
            Logger.info('LMStudioRouteManager shutdown completed');
        } catch (error) {
            Logger.error('Error during LMStudioRouteManager shutdown:', error);
            throw error;
        }
    }

    private async getModelConfig(modelId: string): Promise<{
        modelPath: string;
        modelConfig: Partial<IModelConfig>;
        modelType: ModelType;
    }> {
        const modelInfo = await Model.findById(modelId);
        if (!modelInfo) {
            throw new Error(`Model with ID ${modelId} not found`);
        }

        return {
            modelPath: modelInfo.model_name,
            modelConfig: modelInfo.config_obj || {},
            modelType: modelInfo.model_type
        };
    }

    private createModelConfig(config: Partial<IModelConfig>, modelType: ModelType): LLMLoadModelConfig | EmbeddingLoadModelConfig {
        const baseConfig = {
            contextLength: config.ctx_size || 4096,
            seed: config.seed ?? undefined,
            gpuOffload: {
                ratio: "max",
                mainGpu: 0,
                tensorSplit: []
            },
            keepModelInMemory: true
        };

        if (modelType === ModelType.EMBEDDINGS) {
            return baseConfig as EmbeddingLoadModelConfig;
        }

        return {
            ...baseConfig,
        } as LLMLoadModelConfig;
    }

    async listModels(): Promise<ExtendedDownloadedModel[]> {
        return this.requestQueue.enqueue(async () => {
            try {
                Logger.debug('Fetching models list');
                
                const downloadedModels = await this.lmStudioManager.listModels();
                const loadedLLMs = await this.lmStudioManager.client.llm.listLoaded();
                const loadedEmbeddings = await this.lmStudioManager.client.embedding.listLoaded();
                
                const loadedModels = new Set([
                    ...loadedLLMs.map(m => m.path),
                    ...loadedEmbeddings.map(m => m.path)
                ]);

                return downloadedModels.map(model => ({
                    ...model,
                    isLoaded: loadedModels.has(model.path)
                }));
            } catch (error) {
                Logger.error('Error in listModels:', error);
                throw error;
            }
        }, 'listModels');
    }

    async generateChatCompletion(modelId: string, params: ChatCompletionParams) {
        return this.requestQueue.enqueue(async () => {
            try {
                const { modelPath, modelConfig, modelType } = await this.getModelConfig(modelId);
                
                if (![ModelType.CHAT, ModelType.VISION].includes(modelType)) {
                    if (modelType !== ModelType.INSTRUCT) {
                        throw new Error(`Model type ${modelType} is not supported for chat completion`);
                    } else {
                        Logger.warn(`Model ${modelId} is not of type CHAT OR VISION, but INSTRUCT - using it anyway`);
                    }
                }

                // Update params with the model path
                const updatedParams = {
                    ...params,
                    model: modelPath
                };

                return await this.lmStudioManager.generateChatCompletion(
                    updatedParams,
                    modelConfig.prompt_config,
                    this.createModelConfig(modelConfig, modelType)
                );
            } catch (error) {
                Logger.error('Error in generateChatCompletion:', error);
                throw error;
            }
        }, `chatCompletion-${modelId}`);
    }

    async generateCompletion(modelId: string, params: CompletionParams) {
        return this.requestQueue.enqueue(async () => {
            try {
                const { modelPath, modelConfig, modelType } = await this.getModelConfig(modelId);
                
                if (modelType !== ModelType.INSTRUCT) {
                    if (modelType === ModelType.CHAT) {
                        Logger.warn(`Model ${modelId} is not of type INSTRUCT, but ${modelType} - using it anyway`);
                    } else {
                        throw new Error(`Model type ${modelType} is not supported for text completion`);
                    }
                }

                const updatedParams = {
                    ...params,
                    model: modelPath
                };

                return await this.lmStudioManager.generateCompletion(
                    updatedParams,
                    modelConfig.prompt_config,
                    this.createModelConfig(modelConfig, modelType)
                );
            } catch (error) {
                Logger.error('Error in generateCompletion:', error);
                throw error;
            }
        }, `completion-${modelId}`);
    }

    async generateEmbedding(modelId: string, params: CreateEmbeddingParams) {
        return this.requestQueue.enqueue(async () => {
            try {
                const { modelPath, modelConfig, modelType } = await this.getModelConfig(modelId);
                
                if (modelType !== ModelType.EMBEDDINGS) {
                    throw new Error(`Model type ${modelType} is not supported for embeddings`);
                }

                const updatedParams = {
                    ...params,
                    model: modelPath
                };

                return await this.lmStudioManager.createEmbedding(
                    updatedParams,
                    this.createModelConfig(modelConfig, modelType) as EmbeddingLoadModelConfig
                );
            } catch (error) {
                Logger.error('Error in generateEmbedding:', error);
                throw error;
            }
        }, `embedding-${modelId}`);
    }
}
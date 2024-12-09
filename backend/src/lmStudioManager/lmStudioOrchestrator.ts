import { DownloadedModel, EmbeddingLoadModelConfig, LLMLoadModelConfig } from "@lmstudio/sdk";
import { LMStudioClientManager } from "./lmStudioClientManager";
import { Queue } from "./queueManager";
import Logger from "../utils/logger";
import { ChatCompletionParams, CompletionParams } from "./lmStudio.types";
import { CreateEmbeddingParams } from "./lmStudio.utils";
import { IModelConfig, ModelType } from "../interfaces/model.interface";
import Model from "../models/model.model";

interface ExtendedDownloadedModel extends DownloadedModel {
    isLoaded: boolean;
}

export class LMStudioRouteManager {
    private lmStudioManager: LMStudioClientManager;
    private requestQueue: Queue;

    constructor() {
        this.lmStudioManager = new LMStudioClientManager();
        this.requestQueue = new Queue({
            maxQueueSize: 100,
            operationTimeout: 300000, // 5 minutes
            retryCount: 2,
            retryDelay: 2000
        });
    }

    private async getModelConfig(modelId: string): Promise<{
        modelPath: string;
        modelConfig: IModelConfig;
        modelType: ModelType;
    }> {
        const modelInfo = await Model.findById(modelId);
        if (!modelInfo) {
            throw new Error(`Model with ID ${modelId} not found`);
        }

        return {
            modelPath: modelInfo.model_name,
            modelConfig: modelInfo.config_obj,
            modelType: modelInfo.model_type
        };
    }

    private createModelConfig(config: IModelConfig, modelType: ModelType): LLMLoadModelConfig | EmbeddingLoadModelConfig {
        const baseConfig = {
            contextLength: config.ctx_size,
            seed: config.seed ?? undefined,
            gpuOffload: {
                ratio: "max",
                mainGpu: 0,
                tensorSplit: []
            },
            keepModelInMemory: true
        };

        // Return appropriate config based on model type
        if (modelType === ModelType.EMBEDDINGS) {
            return baseConfig as EmbeddingLoadModelConfig;
        }

        return {
            ...baseConfig,
            // Add any LLM-specific configurations here
        } as LLMLoadModelConfig;
    }

    async listModels(): Promise<ExtendedDownloadedModel[]> {
        return this.requestQueue.enqueue(async () => {
            try {
                Logger.debug('Fetching models list');
                
                // Get all downloaded models
                const downloadedModels = await this.lmStudioManager.listModels();
                
                // Get currently loaded models for comparison
                const loadedLLMs = await this.lmStudioManager.client.llm.listLoaded();
                const loadedEmbeddings = await this.lmStudioManager.client.embedding.listLoaded();
                
                // Combine loaded model lists for easier checking
                const loadedModels = new Set([
                    ...loadedLLMs.map(m => m.path),
                    ...loadedEmbeddings.map(m => m.path)
                ]);

                // Map downloaded models to extended interface with loaded status
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
                    throw new Error(`Model type ${modelType} is not supported for chat completion`);
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
                    throw new Error(`Model type ${modelType} is not supported for text completion`);
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

    // Additional utility methods
    async shutdown() {
        try {
            await this.lmStudioManager.unloadAllModels();
        } catch (error) {
            Logger.error('Error during shutdown:', error);
            throw error;
        }
    }
}
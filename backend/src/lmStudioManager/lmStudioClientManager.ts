import {
    LMStudioClient, LLMDynamicHandle, OngoingPrediction, DownloadedModel, 
    LLMLoadModelConfig, EmbeddingLoadModelConfig, LLMPredictionOpts, EmbeddingDynamicHandle
} from "@lmstudio/sdk";
import {
    CreateEmbeddingParams, CreateEmbeddingResponse,
    mapStopReason, retrieveToolCalls
} from './lmStudio.utils';
import Logger from "../utils/logger"
import { MessageBuilder } from "./messageBuilder";
import { FileService } from "./fileService";
import {
    ChatCompletionParams, ChatCompletionResponse, 
    ChatTemplateTokens, 
    CompletionParams, CompletionResponse, 
    DEFAULT_MODEL_CONFIG, DEFAULT_TOKENS,
    LM_STUDIO_URL, LoadedModel
} from "./lmStudio.types";

export class LMStudioClientManager {
    public client: LMStudioClient;
    private loadedModels: { [key: string]: LoadedModel } = {};
    private messageBuilder: MessageBuilder;
    private inactivityThreshold: number;

    constructor(inactivityThreshold: number = 10 * 60 * 1000) {
        this.inactivityThreshold = inactivityThreshold;
        this.client = new LMStudioClient({
            baseUrl: `ws://${LM_STUDIO_URL}`,
            verboseErrorMessages: true,
            logger: {
                info: (...args) => Logger.info('LMStudioClient Info:', ...args),
                error: (...args) => Logger.error('LMStudioClient Error:', ...args),
                warn: (...args) => Logger.warn('LMStudioClient Warning:', ...args),
                debug: (...args) => Logger.debug('LMStudioClient Debug:', ...args),
            },
        });

        const fileNamespace = this.client.files;
        this.messageBuilder = new MessageBuilder(new FileService(fileNamespace));

        // Set up the interval for inactive model unloading
        setInterval(() => this.unloadInactiveModels(), 180 * 1000);

        Logger.info('LMStudioClient initialized');
    }

    private async handlePrediction<T extends ChatCompletionResponse | CompletionResponse>(
        prediction: OngoingPrediction,
        modelId: string,
        type: 'chat' | 'completion',
        stream: boolean = false
    ): Promise<T | ReadableStream> {
        if (stream) {
            return new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of prediction) {
                            const content = typeof chunk === 'object' && chunk.content ?
                                chunk.content :
                                typeof chunk === 'string' ?
                                    chunk : '';
    
                            const baseResponse = {
                                id: `${type === 'chat' ? 'chatcmpl' : 'cmpl'}-${Date.now()}`,
                                created: Math.floor(Date.now() / 1000),
                                model: modelId,
                            };
    
                            if (type === 'chat') {
                                const chunkResponse = {
                                    ...baseResponse,
                                    object: "chat.completion.chunk",
                                    choices: [{
                                        index: 0,
                                        delta: {
                                            content: content.trim(),
                                        },
                                        finish_reason: null,
                                    }],
                                };
                                controller.enqueue(`data: ${JSON.stringify(chunkResponse)}\n\n`);
                            } else {
                                const chunkResponse = {
                                    ...baseResponse,
                                    object: "text_completion",
                                    choices: [{
                                        text: content.trim(),
                                        index: 0,
                                        logprobs: null,
                                        finish_reason: null,
                                    }],
                                };
                                controller.enqueue(`data: ${JSON.stringify(chunkResponse)}\n\n`);
                            }
                        }
                    } catch (error) {
                        Logger.error(`Error in streaming ${type} response:`, error);
                        controller.error(error);
                    } finally {
                        controller.close();
                    }
                }
            });
        }
    
        try {
            const result = await prediction;
            const content = result.content.trim();
            const baseResponse = {
                id: `${type === 'chat' ? 'chatcmpl' : 'cmpl'}-${Date.now()}`,
                created: Math.floor(Date.now() / 1000),
                model: modelId,
                usage: {
                    prompt_tokens: result.stats.promptTokensCount || 0,
                    completion_tokens: result.stats.predictedTokensCount || 0,
                    total_tokens: result.stats.totalTokensCount || 0,
                },
            };
    
            if (type === 'chat') {
                const toolCalls = retrieveToolCalls(content);
                return {
                    ...baseResponse,
                    object: "chat.completion" as const,
                    choices: [{
                        index: 0,
                        message: {
                            role: "assistant",
                            content: toolCalls ? null : content,
                            tool_calls: toolCalls || undefined,
                        },
                        finish_reason: mapStopReason(result.stats.stopReason),
                    }],
                } as T;
            }
    
            return {
                ...baseResponse,
                object: "text_completion" as const,
                choices: [{
                    text: content,
                    index: 0,
                    logprobs: null,
                    finish_reason: mapStopReason(result.stats.stopReason),
                }],
            } as T;
        } catch (error) {
            Logger.error(`Error in ${type} response:`, error);
            throw error;
        }
    }
    
    // Then update the completion methods to use the generic properly:
    async generateCompletion(params: CompletionParams, opts: ChatTemplateTokens = DEFAULT_TOKENS, model_opts: LLMLoadModelConfig = DEFAULT_MODEL_CONFIG): Promise<CompletionResponse | ReadableStream> {
        try {
            const model = await this.getOrLoadModel(params.model, model_opts) as LLMDynamicHandle;
            const promptTemplate = this.messageBuilder.createPromptTemplate(opts, params);
            const config: LLMPredictionOpts = {
                maxPredictedTokens: params.max_tokens ?? undefined,
                temperature: params.temperature ?? undefined,
                stopStrings: params.stop ? params.stop as string[] : undefined,
                promptTemplate
            };
            const prediction = model.complete(params.prompt, config);
            return this.handlePrediction<CompletionResponse>(
                prediction, 
                params.model, 
                'completion', 
                params.stream ?? false
            );
        } catch (error) {
            Logger.error('Error in completion generation:', error);
            throw error;
        }
    }
    
    async generateChatCompletion(params: ChatCompletionParams, opts: ChatTemplateTokens = DEFAULT_TOKENS, model_opts: LLMLoadModelConfig = DEFAULT_MODEL_CONFIG): Promise<ChatCompletionResponse | ReadableStream> {
        try {
            const model = await this.getOrLoadModel(params.model, model_opts) as LLMDynamicHandle;
            Logger.debug('Model loaded. Chat completion params:', params);
            const { history, promptTemplate } = await this.messageBuilder.buildChatHistory(params, opts);
    
            const config: LLMPredictionOpts = {
                maxPredictedTokens: params.max_tokens ?? undefined,
                temperature: params.temperature ?? undefined,
                stopStrings: params.stop ? params.stop as string[] : undefined,
                promptTemplate
            };
            Logger.debug('Chat completion config:', config);
            Logger.debug('Chat completion history:', history);
            const prediction = model.respond(history, config);
            return this.handlePrediction<ChatCompletionResponse>(
                prediction, 
                params.model, 
                'chat', 
                params.stream ?? false
            );
        } catch (error) {
            Logger.error('Error in chat completion:', error);
            throw error;
        }
    }

    async createEmbedding(params: CreateEmbeddingParams, model_opts: EmbeddingLoadModelConfig = DEFAULT_MODEL_CONFIG): Promise<CreateEmbeddingResponse> {
        try {
            const inputs = Array.isArray(params.input) ? params.input : [params.input];
            
            const model = await this.getOrLoadModel(params.model, model_opts) as EmbeddingDynamicHandle;
            if (this.loadedModels[params.model]?.type !== 'embedding') {
                throw new Error(`Model ${params.model} is not an embedding model`);
            }

            const embeddings = await Promise.all(
                inputs.map(async (input, index) => {
                    const result = await model.embedString(input);
                    return {
                        object: 'embedding' as const,
                        embedding: result.embedding,
                        index
                    };
                })
            );

            const totalTokens = await Promise.all(
                inputs.map(input => model.tokenize(input))
            ).then(tokenArrays => tokenArrays.reduce((sum, tokens) => sum + tokens.length, 0));

            return {
                object: 'list',
                data: embeddings,
                model: params.model,
                usage: {
                    prompt_tokens: totalTokens,
                    total_tokens: totalTokens
                }
            };
        } catch (error) {
            Logger.error('Error in embedding generation:', error);
            throw error;
        }
    }

    async getOrLoadModel(
        modelPath: string,
        config: Partial<LLMLoadModelConfig | EmbeddingLoadModelConfig> = {}
    ): Promise<LLMDynamicHandle | EmbeddingDynamicHandle> {
        // Check if model is already loaded
        if (this.loadedModels[modelPath]) {
            Logger.info(`Using already loaded model ${modelPath}`);
            this.loadedModels[modelPath].lastUsed = Date.now();
            return this.loadedModels[modelPath].model;
        }

        // Check availability and model type
        const availableModels = await this.client.system.listDownloadedModels();
        const modelInfo = availableModels.find(model => model.path.includes(modelPath));

        if (!modelInfo) {
            throw new Error(`Model ${modelPath} is not available in the system`);
        }

        // Determine model type and create appropriate config
        const modelType = modelInfo.type;
        let defaultConfig: LLMLoadModelConfig | EmbeddingLoadModelConfig;
        
        if (modelType === 'llm') {
            defaultConfig = {
                ...DEFAULT_MODEL_CONFIG,
                gpuOffload: DEFAULT_MODEL_CONFIG.gpuOffload
            };
        } else if (modelType === 'embedding') {
            defaultConfig = {
                gpuOffload: {
                    ratio: "max",
                    mainGpu: 0,
                    tensorSplit: []
                },
                keepModelInMemory: true
            };
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }

        const finalConfig = {
            ...defaultConfig,
            ...config
        };

        // Load the model using the appropriate client namespace
        Logger.info(`Model ${modelPath} not loaded, loading now with config:`, finalConfig);
        let model: LLMDynamicHandle | EmbeddingDynamicHandle;

        if (modelType === 'llm') {
            model = await this.client.llm.load(modelPath, {
                config: finalConfig as LLMLoadModelConfig,
                verbose: true
            });
        } else {
            model = await this.client.embedding.load(modelPath, {
                config: finalConfig as EmbeddingLoadModelConfig,
                verbose: true
            });
        }

        this.loadedModels[modelPath] = { 
            model, 
            lastUsed: Date.now(),
            type: modelType 
        };

        return model;
    }

    private async unloadInactiveModels() {
        try {
            const now = Date.now();

            for (const [modelId, { model, lastUsed, type }] of Object.entries(this.loadedModels)) {
                if (now - lastUsed > this.inactivityThreshold) {
                    Logger.info(`Unloading inactive ${type} model: ${modelId}`);
                    const namespace = type === 'llm' ? this.client.llm : this.client.embedding;
                    
                    try {
                        await namespace.unload(modelId);
                        delete this.loadedModels[modelId];
                        Logger.info(`Successfully unloaded inactive ${type} model: ${modelId}`);
                    } catch (error) {
                        Logger.error(`Failed to unload inactive ${type} model ${modelId}:`, error);
                    }
                }
            }
        } catch (error) {
            Logger.error('Error in unloadInactiveModels:', error);
        }
    }

    async unloadModel(modelId: string) {
        const loadedModel = this.loadedModels[modelId];
        if (loadedModel) {
            try {
                Logger.debug(`Starting unload for ${loadedModel.type} model: ${modelId}`);
                const namespace = loadedModel.type === 'llm' ? this.client.llm : this.client.embedding;
                await namespace.unload(modelId);
                delete this.loadedModels[modelId];
                Logger.info(`Successfully unloaded ${loadedModel.type} model: ${modelId}`);
            } catch (error) {
                Logger.error(`Failed to unload ${loadedModel.type} model ${modelId}:`, error);
                throw error;
            }
        } else {
            Logger.info(`Model ${modelId} is not loaded - no action needed`);
        }
    }
    async listModels(): Promise<DownloadedModel[]> {
        try {
            Logger.debug('Fetching downloaded models...');
            const models = await this.client.system.listDownloadedModels();
            Logger.debug('Downloaded Models len:', models.length);
            return models;
        } catch (error) {
            Logger.error('Error listing models:', error);
            throw error;
        }
    }
    
    async checkModelAvailability(modelPath: string): Promise<boolean> {
        try {
            Logger.debug('Checking model availability:', modelPath);
            const downloadedModels = await this.client.system.listDownloadedModels();
            const isAvailable = downloadedModels.some(model => model.path.includes(modelPath));
            Logger.debug(`Model ${modelPath} availability:`, isAvailable);
            return isAvailable;
        } catch (error) {
            Logger.error(`Error checking availability for model ${modelPath}:`, error);
            throw error;
        }
    }
    
    async unloadAllModels() {
        Logger.info('Unloading all models...');
        try {
            // Get lists of both types of loaded models
            const loadedLLMList = await this.client.llm.listLoaded();
            const loadedEmbeddingList = await this.client.embedding.listLoaded();
            
            Logger.debug(`Found ${loadedLLMList.length} LLM models and ${loadedEmbeddingList.length} embedding models`);
    
            if (loadedLLMList.length === 0 && loadedEmbeddingList.length === 0) {
                Logger.info('No models to unload');
                return;
            }
    
            // Unload all LLM models
            for (const model of loadedLLMList) {
                try {
                    await this.client.llm.unload(model.identifier);
                    Logger.debug(`Successfully unloaded LLM model: ${model.identifier}`);
                } catch (error) {
                    Logger.error(`Failed to unload LLM model ${model.identifier}:`, error);
                }
            }
    
            // Unload all embedding models
            for (const model of loadedEmbeddingList) {
                try {
                    await this.client.embedding.unload(model.identifier);
                    Logger.debug(`Successfully unloaded embedding model: ${model.identifier}`);
                } catch (error) {
                    Logger.error(`Failed to unload embedding model ${model.identifier}:`, error);
                }
            }
    
            // Clear our loaded models tracking
            this.loadedModels = {};
            Logger.info('Successfully unloaded all models');
        } catch (error) {
            Logger.error("Error in unloadAllModels:", error);
            throw error;
        }
    }
}
import { LMStudioClient, LLMDynamicHandle, OngoingPrediction, LLMChatResponseOpts, PredictionResult, LLMChatHistoryMessage } from "@lmstudio/sdk";
import Model from '../models/model.model';
import { callLMStudioMethod, ChatCompletionResponse, CompletionParams, CompletionResponse, convertToLLMMessage, getToolSystemMessages, mapStopReason, ToolCall } from './lmStudio.utils';
import { runNetworkTests } from './lmStudioNetworkTests';
import { ChatCompletionParams } from "./lmStudio.utils";
import { v4 as uuidv4 } from 'uuid';
import Logger from "./logger";

class Queue {
    private queue: (() => Promise<any>)[] = [];
    private isProcessing: boolean = false;

    async enqueue<T>(operation: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await operation();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const operation = this.queue.shift();
            if (operation) {
                try {
                    await operation();
                } catch (error) {
                    Logger.error('Error processing queue operation:', error);
                }
            }
        }

        this.isProcessing = false;
    }
}

interface LoadedModel {
    model: LLMDynamicHandle;
    lastUsed: number;
}

export class LMStudioManager {
    private client: LMStudioClient;
    private loadedModels: { [key: string]: LoadedModel } = {};
    private queue: Queue;
    private inactivityThreshold: number;

    constructor(inactivityThreshold: number = 10 * 60 * 1000) {
        this.inactivityThreshold = inactivityThreshold;
        this.queue = new Queue();
        this.client = new LMStudioClient({
            baseUrl: "ws://host.docker.internal:1234",
            verboseErrorMessages: true,
            logger: {
                info: (...args) => Logger.info('LMStudioClient Info:', ...args),
                error: (...args) => Logger.error('LMStudioClient Error:', ...args),
                warn: (...args) => Logger.warn('LMStudioClient Warning:', ...args),
                debug: (...args) => Logger.debug('LMStudioClient Debug:', ...args),
            },
        });
        this.initializeClient();
    }

    private initializeClient() {
        Logger.info('Initializing LMStudioClient...');
        this.client = new LMStudioClient({
            baseUrl: "ws://host.docker.internal:1234",
            verboseErrorMessages: true,
            logger: {
                info: (...args) => Logger.info('LMStudioClient Info:', ...args),
                error: (...args) => Logger.error('LMStudioClient Error:', ...args),
                warn: (...args) => Logger.warn('LMStudioClient Warning:', ...args),
                debug: (...args) => Logger.debug('LMStudioClient Debug:', ...args),
            },
        });
        Logger.info('LMStudioClient initialized');
        this.runInitialTests();
        this.setupPeriodicTasks();
    }

    private async runInitialTests() {
        Logger.info('Running network tests...');
        try {
            await runNetworkTests();
            Logger.info('Network tests completed');
        } catch (error) {
            Logger.error('Network tests failed:', error);
        }

        // Logger.log('Running WebSocket test...');
        // try {
        //     await testWebSocket("ws://host.docker.internal:1234");
        //     Logger.log('WebSocket test completed successfully');
        // } catch (error) {
        //     Logger.error('WebSocket test failed:', error);
        // }

        Logger.debug('Testing listDownloadedModels...');
        try {
            const models = await this.client.system.listDownloadedModels();
            Logger.debug('Downloaded models:', models);
        } catch (error) {
            Logger.error('Error listing downloaded models:', error);
        }
    }

    private setupPeriodicTasks() {
        Logger.info('Unloading all models...');
        this.unloadAllModels().then(() => {
            Logger.info('Unload all models completed');
        }).catch(error => {
            Logger.error('Error unloading all models:', error);
        });

        Logger.info('Setting up periodic model unloading...');
        setInterval(() => this.unloadInactiveModels(), 30 * 1000); // Every 30 seconds
    }

    async getOrLoadModel(modelId: string): Promise<LLMDynamicHandle> {
        return this.queue.enqueue(async () => {
            if (this.loadedModels[modelId]) {
                Logger.info(`Using already loaded model ${modelId}`);
                this.loadedModels[modelId].lastUsed = Date.now();
                return this.loadedModels[modelId].model;
            }
            Logger.info(`Model ${modelId} not loaded, loading now...`);
            return await this.loadModel(modelId);
        });
    }

    async isModelAvailable(client: LMStudioClient, model_name: string) {
        Logger.debug('Checking if model is available:', model_name);
        const downloadedModels = await client.system.listDownloadedModels();
        Logger.debug('Downloaded Models:', downloadedModels);
        const isModelAvailable = downloadedModels.some((model: any) => model.path.includes(model_name));
        return isModelAvailable
    }

    private async loadModel(modelId: string): Promise<LLMDynamicHandle> {
        try {
            Logger.info(`Loading model ${modelId}...`);
            const modelInfo = await Model.findById(modelId);
            if (!modelInfo) {
                throw new Error(`Model with id ${modelId} not found in the database`);
            }
            const isModelAv = await this.isModelAvailable(this.client, modelInfo.model_name);

            if (!isModelAv) {
                throw new Error(`Model ${modelInfo.model_name} is not available in the system`);
            }

            Logger.info('Loading model with Info:', modelInfo);
            const model: LLMDynamicHandle = await callLMStudioMethod(`load_${modelId}`, () => this.client.llm.load(modelInfo.model_name, {
                config: {
                    gpuOffload: "max",
                    contextLength: modelInfo.ctx_size,
                },
                preset: process.env.LM_STUDIO_DEFAULT_PRESET || "OpenChat",
                noHup: true,
                verbose: true,
            }));
            this.loadedModels[modelId] = { model, lastUsed: Date.now() };
            Logger.info(`Successfully loaded model ${modelId}`);
            return model;
        } catch (error) {
            Logger.error(`Error loading model ${modelId}:`, error);
            throw new Error(`Failed to load model ${modelId}`);
        }
    }

    private async unloadInactiveModels() {
        return this.queue.enqueue(async () => {
            const now = Date.now();
            for (const [modelId, { model, lastUsed }] of Object.entries(this.loadedModels)) {
                if (now - lastUsed > this.inactivityThreshold) {
                    Logger.info(`Unloading inactive model: ${modelId}`);
                    try {
                        const modelInfo = await this.getModelInfo(modelId);
                        await callLMStudioMethod(`unload_${modelId}`, () => this.client.llm.unload(modelInfo.modelInfo.name));
                        delete this.loadedModels[modelId];
                        Logger.info(`Successfully unloaded inactive model: ${modelId}`);
                    } catch (error) {
                        Logger.error(`Failed to unload inactive model ${modelId}:`, error);
                    }
                }
            }
        });
    }

    private async unloadAllModels() {
        return this.queue.enqueue(async () => {
            try {
                const loadedModelsList = await callLMStudioMethod('listLoaded', () => this.client.llm.listLoaded());
                Logger.debug("Loaded models:", loadedModelsList);
                for (const model of loadedModelsList) {
                    Logger.debug(`Unloading model: ${model.identifier}`);
                    await callLMStudioMethod(`unload_${model.identifier}`, () => this.client.llm.unload(model.identifier));
                    Logger.debug(`Successfully unloaded model: ${model.identifier}`);
                }
                this.loadedModels = {};
            } catch (error) {
                Logger.error("Error unloading models:", error);
            }
        });
    }

    private retrieveToolCalls(content: string): ToolCall[] | false {
        const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
        const toolCalls: ToolCall[] = [];
        Logger.debug(`Retrieving tool calls from content:`, content);
        let match;

        while ((match = toolCallRegex.exec(content)) !== null) {
            let rawToolCall = match[1].trim();
            Logger.debug('Raw tool call:', rawToolCall);

            try {
                // Attempt to unescape the JSON string if it's escaped
                try {
                    rawToolCall = JSON.parse(`"${rawToolCall.replace(/"/g, '\\"')}"`);
                } catch (unescapeError) {
                    Logger.debug('Unescaping failed, proceeding with raw string');
                }

                Logger.debug('Unescaped/raw tool call:', rawToolCall);

                // Parse the JSON
                const toolCallJson = JSON.parse(rawToolCall);

                // Validate the parsed JSON structure
                if (typeof toolCallJson.name === 'string' && toolCallJson.arguments !== undefined) {
                    toolCalls.push({
                        id: uuidv4(),
                        type: "function",
                        function: {
                            name: toolCallJson.name,
                            arguments: typeof toolCallJson.arguments === 'string'
                                ? toolCallJson.arguments
                                : JSON.stringify(toolCallJson.arguments)
                        }
                    });
                } else {
                    Logger.warn('Invalid tool call structure:', toolCallJson);
                }
            } catch (error) {
                Logger.error('Error parsing tool call:', error);
                Logger.error('Problematic JSON string:', rawToolCall);

                // Attempt to recover from common JSON errors
                try {
                    const correctedJson = rawToolCall
                        .replace(/'/g, '"')  // Replace single quotes with double quotes
                        .replace(/(\w+):/g, '"$1":')  // Add quotes to keys
                        .replace(/,\s*([\]}])/g, '$1')  // Remove trailing commas
                        .replace(/\\/g, '');  // Remove any remaining backslashes

                    const toolCallJson = JSON.parse(correctedJson);

                    if (typeof toolCallJson.name === 'string' && toolCallJson.arguments !== undefined) {
                        Logger.debug('Successfully recovered from JSON error');
                        toolCalls.push({
                            id: uuidv4(),
                            type: "function",
                            function: {
                                name: toolCallJson.name,
                                arguments: typeof toolCallJson.arguments === 'string'
                                    ? toolCallJson.arguments
                                    : JSON.stringify(toolCallJson.arguments)
                            }
                        });
                    } else {
                        Logger.warn('Invalid tool call structure after recovery attempt:', toolCallJson);
                    }
                } catch (recoveryError) {
                    Logger.error('Failed to recover from JSON error:', recoveryError);
                }
            }
        }

        Logger.debug('Processed tool calls:', toolCalls);

        return toolCalls.length > 0 ? toolCalls : false;
    }
    async generateCompletion(params: CompletionParams): Promise<CompletionResponse | ReadableStream> {
        const model = await this.getOrLoadModel(params.model);
        const opts: LLMChatResponseOpts = {
            maxPredictedTokens: params.max_tokens ?? undefined,
            temperature: params.temperature ?? undefined,
            stopStrings: params.stop ? params.stop as string[] : undefined,
        };
        Logger.info('Model loaded:', params.model);

        const prediction: OngoingPrediction = model.complete(params.prompt, opts);

        if (params.stream) {
            return new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of prediction) {
                            const chunkResponse = {
                                id: `cmpl-${Date.now()}`,
                                object: "text_completion",
                                created: Math.floor(Date.now() / 1000),
                                model: params.model,
                                choices: [{
                                    text: chunk.trim(),
                                    index: 0,
                                    logprobs: null,
                                    finish_reason: null,
                                }],
                            };
                            controller.enqueue(`data: ${JSON.stringify(chunkResponse)}\n\n`);
                        }
                    } catch (error) {
                        Logger.error('Error in streaming response:', error);
                        controller.error(error);
                    } finally {
                        controller.close();
                    }
                }
            });
        } else {
            let result: PredictionResult;
            if ('result' in prediction && typeof prediction.result === 'function') {
                result = await prediction.result();
            } else if (prediction instanceof Promise) {
                result = await prediction;
            } else {
                throw new Error('Unexpected prediction type');
            }

            const response: CompletionResponse = {
                id: `cmpl-${Date.now()}`,
                object: "text_completion",
                created: Math.floor(Date.now() / 1000),
                model: params.model,
                choices: [{
                    text: result.content.trim(),
                    index: 0,
                    logprobs: null,
                    finish_reason: mapStopReason(result.stats.stopReason),
                }],
                usage: {
                    prompt_tokens: result.stats.promptTokensCount || 0,
                    completion_tokens: result.stats.predictedTokensCount || 0,
                    total_tokens: result.stats.totalTokensCount || 0,
                },
            };

            return response;
        }
    }

    async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse | ReadableStream> {
        const model = await this.getOrLoadModel(params.model);

        // Convert incoming messages to LLM Studio format and ensure they match LLMChatHistoryMessage type
        const processedMessages = params.messages.map(msg => convertToLLMMessage(msg));

        const toolSystemMessages = getToolSystemMessages(params.tools ?? [], params.tool_choice ?? 'auto')
            .map(msg => convertToLLMMessage(msg));

        // Combine messages ensuring they're all LLMChatHistoryMessage type
        const updatedMessages: LLMChatHistoryMessage[] = [...toolSystemMessages, ...processedMessages];

        const opts: LLMChatResponseOpts = {
            maxPredictedTokens: params.max_tokens ?? undefined,
            temperature: params.temperature ?? undefined,
            stopStrings: params.stop ? params.stop as string[] : undefined,
        };

        const prediction: OngoingPrediction = model.respond(updatedMessages, opts);

        // Rest of the method remains the same...
        if (params.stream) {
            return new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of prediction) {
                            const chunkResponse = {
                                id: `chatcmpl-${Date.now()}`,
                                object: "chat.completion.chunk",
                                created: Math.floor(Date.now() / 1000),
                                model: params.model,
                                choices: [{
                                    index: 0,
                                    delta: {
                                        content: chunk.trim(),
                                    },
                                    finish_reason: null,
                                }],
                            };
                            controller.enqueue(`data: ${JSON.stringify(chunkResponse)}\n\n`);
                        }
                    } catch (error) {
                        Logger.error('Error in streaming response:', error);
                        controller.error(error);
                    } finally {
                        controller.close();
                    }
                }
            });
        }

        let result: PredictionResult;
        if ('result' in prediction && typeof prediction.result === 'function') {
            result = await prediction.result();
        } else if (prediction instanceof Promise) {
            result = await prediction;
        } else {
            throw new Error('Unexpected prediction type');
        }

        const content = result.content.trim();
        const toolCalls = this.retrieveToolCalls(content);

        return {
            id: `chatcmpl-${Date.now()}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: params.model,
            choices: [{
                index: 0,
                message: {
                    role: "assistant",
                    content: toolCalls ? null : content,
                    tool_calls: toolCalls || undefined,
                },
                finish_reason: mapStopReason(result.stats.stopReason),
            }],
            usage: {
                prompt_tokens: result.stats.promptTokensCount || 0,
                completion_tokens: result.stats.predictedTokensCount || 0,
                total_tokens: result.stats.totalTokensCount || 0,
            },
        };
    }
    async listAvailableModels() {
        const dbModels = await Model.find({ api_name: 'lm_studio', api_type: 'llm_api' });
        const downloadedModels = await this.client.system.listDownloadedModels();
        return dbModels.map(dbModel => {
            const isDownloaded = downloadedModels.some(dm => dm.path.includes(dbModel.model_name));
            const isLoaded = !!this.loadedModels[dbModel._id.toString()];
            return {
                id: dbModel._id,
                name: dbModel.model_name,
                shortName: dbModel.short_name,
                type: dbModel.model_type,
                format: dbModel.model_format,
                contextSize: dbModel.ctx_size,
                isDownloaded,
                isLoaded
            };
        });
    }

    async unloadModel(modelId: string) {
        return this.queue.enqueue(async () => {
            if (this.loadedModels[modelId]) {
                await callLMStudioMethod(`unload_${modelId}`, () => this.client.llm.unload(modelId));
                delete this.loadedModels[modelId];
                Logger.info(`Successfully unloaded model: ${modelId}`);
            } else {
                Logger.info(`Model ${modelId} is not loaded`);
            }
        });
    }

    async getModelInfo(modelId: string) {
        const modelInfo = await Model.findById(modelId);
        if (!modelInfo) {
            throw new Error('Model not found in database');
        }

        const isModelAv = await this.isModelAvailable(this.client, modelInfo.model_name);

        return {
            available: isModelAv,
            loaded: !!this.loadedModels[modelId],
            modelInfo: {
                name: modelInfo.model_name,
                type: modelInfo.model_type,
                format: modelInfo.model_format,
                contextSize: modelInfo.ctx_size
            }
        };
    }
}

export const lmStudioManager = new LMStudioManager();
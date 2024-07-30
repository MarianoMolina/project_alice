import express from 'express';
import { LMStudioClient, OngoingPrediction, PredictionResult } from "@lmstudio/sdk";
import Model from '../models/model.model';
import { IModelDocument } from '../interfaces/model.interface';
import { LoadedModel, unloadAllModels, unloadInactiveModels, isValidJsonContent, getOrLoadModel, getToolSystemMessages, mapStopReason, isModelAvailable } from '../utils/lmStudio.utils';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const client: LMStudioClient = new LMStudioClient({
    baseUrl: "ws://host.docker.internal:1234",
});

const loadedModels: { [key: string]: LoadedModel } = {};

// Call this function when the server starts
unloadAllModels(client);

const INACTIVITY_THRESHOLD = 10 * 60 * 1000; // 10 minutes in milliseconds
const CHECK_INTERVAL = 30 * 1000; // 30 seconds in milliseconds

// Periodically check and unload inactive models
setInterval(() => unloadInactiveModels(client, loadedModels, INACTIVITY_THRESHOLD), CHECK_INTERVAL);

router.post('/chat/completions', async (req, res) => {
    const {
        model: modelId,
        messages,
        max_tokens,
        n = 1,
        temperature = 1,
        stop,
        stream = false,
        tools,
        tool_choice = 'auto',
    } = req.body;

    try {
        console.log('Generating chat completion...');
        const model = await getOrLoadModel(modelId, client, loadedModels);
        console.log('Model loaded:', modelId);
        
        const toolSystemMessages = getToolSystemMessages(tools, tool_choice);
        const updatedMessages = [...toolSystemMessages, ...messages];

        const generateCompletion = async (index: number) => {
            const response: OngoingPrediction = model.respond(updatedMessages, {
                maxPredictedTokens: max_tokens,
                temperature,
                stopStrings: stop,
            });

            if (stream) {
                for await (const chunk of response) {
                    const chunkResponse = {
                        id: `chatcmpl-${Date.now()}`,
                        object: "chat.completion.chunk",
                        created: Math.floor(Date.now() / 1000),
                        model: modelId,
                        choices: [{
                            index,
                            delta: {
                                content: chunk.trim(),
                            },
                            finish_reason: null,
                        }],
                    };
                    res.write(`data: ${JSON.stringify(chunkResponse)}\n\n`);
                }
                const final_response: PredictionResult = await response.result();
                // Final chunk with finish reason and usage
                const finalChunk = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1000),
                    model: modelId,
                    choices: [{
                        index,
                        delta: {},
                        finish_reason: mapStopReason(final_response.stats.stopReason),
                    }],
                    usage: {
                        prompt_tokens: final_response.stats.promptTokensCount,
                        completion_tokens: final_response.stats.predictedTokensCount,
                        total_tokens: final_response.stats.totalTokensCount,
                    },
                };
                res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
                return final_response;
            } else {
                return await response.result();
            }
        };

        if (stream) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            });

            const completionPromises = Array(n).fill(null).map((_, index) => generateCompletion(index));
            await Promise.all(completionPromises);

            res.write('data: [DONE]\n\n');
            res.end();
        } else {
            const completions = await Promise.all(Array(n).fill(null).map((_, index) => generateCompletion(index)));
            const openAIResponse = {
                id: `chatcmpl-${Date.now()}`,
                object: "chat.completion",
                created: Math.floor(Date.now() / 1000),
                model: modelId,
                choices: completions.map((final_response, index) => {
                    if (!final_response) return null;
                    const content = final_response.content.trim();
                    const isJson = isValidJsonContent(content);
                    return {
                        index,
                        message: {
                            role: "assistant",
                            content: isJson ? null : content,
                            tool_calls: isJson ? [JSON.parse(content)] : undefined,
                        },
                        finish_reason: mapStopReason(final_response.stats.stopReason),
                    };
                }).filter(choice => choice !== null),
                usage: completions[0] ? {
                    prompt_tokens: completions[0].stats.promptTokensCount,
                    completion_tokens: completions[0].stats.predictedTokensCount,
                    total_tokens: completions[0].stats.totalTokensCount,
                } : undefined,
            };
            res.json(openAIResponse);
        }
    } catch (error) {
        console.error('Error generating chat completion:', error);
        res.status(500).json({ error: 'Failed to generate chat completion' });
    }
});

// Check model endpoint
router.get('/models/:modelId', async (req, res) => {
    const { modelId } = req.params;

    try {
        const modelInfo = await Model.findById(modelId);
        if (!modelInfo) {
            return res.status(404).json({ error: 'Model not found in database' });
        }

        const isModelAv = isModelAvailable(client, modelInfo.model_name);

        res.json({
            available: isModelAv,
            loaded: !!loadedModels[modelId],
            modelInfo: {
                name: modelInfo.model_name,
                type: modelInfo.model_type,
                format: modelInfo.model_format,
                contextSize: modelInfo.ctx_size
            }
        });
    } catch (error) {
        console.error('Error checking model:', error);
        res.status(500).json({ error: 'Failed to check model' });
    }
});

// List available models endpoint
router.get('/models', async (req, res) => {
    try {
        const dbModels = await Model.find({ api_name: 'lm-studio' });
        const downloadedModels = await client.system.listDownloadedModels();
        console.log('Downloaded models:', downloadedModels);

        const availableModels = dbModels.map((dbModel: IModelDocument) => {
            const isDownloaded = downloadedModels.some((dm: any) => dm.path.includes(dbModel.model_name));
            return {
                id: dbModel._id,
                name: dbModel.model_name,
                shortName: dbModel.short_name,
                type: dbModel.model_type,
                format: dbModel.model_format,
                contextSize: dbModel.ctx_size,
                isDownloaded,
                isLoaded: !!loadedModels[dbModel._id.toString()]
            };
        });

        res.json(availableModels);
    } catch (error) {
        console.error('Error listing models:', error);
        res.status(500).json({ error: 'Failed to list models' });
    }
});

export default router;
import express from 'express';
import { lmStudioManager } from '../utils/lmStudioManager';
import { Stream } from 'openai/streaming';
import axios from 'axios';
import { ChatCompletionParams, CompletionParams } from '../utils/lmStudio.utils';

const router = express.Router();
// New proxy endpoint - Just to see what is being sent to the model
router.post('/proxy/chat/completions', async (req, res) => {
    console.log('Received request:', {
        headers: req.headers,
        body: JSON.stringify(req.body)
    });

    try {
        const response = await axios.post('http://host.docker.internal:1234/v1/chat/completions', req.body, {
            headers: req.headers,
            responseType: 'stream'
        });

        response.data.pipe(res);
    } catch (error) {
        console.error('Error forwarding request:', error);
        res.status(500).json({ error: 'Failed to forward request' });
    }
});


router.post('/chat/completions', async (req, res) => {
    const params = req.body as ChatCompletionParams;
    try {
        if (!params) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        const completionResult = await lmStudioManager.generateChatCompletion(params);
        if (params.stream) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            });
            if (completionResult instanceof Stream) {
                for await (const chunk of completionResult) {
                    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                }
                res.write('data: [DONE]\n\n');
            } else {
                res.write(`data: ${JSON.stringify(completionResult)}\n\n`);
                res.write('data: [DONE]\n\n');
            }
            res.end();
        } else {
            res.json(completionResult);
        }
    } catch (error) {
        console.error('Error generating chat completion:', error);
        res.status(500).json({ error: 'Failed to generate chat completion' });
    }
});

router.get('/models/:modelId', async (req, res) => {
    const { modelId } = req.params;
    try {
        const modelInfo = await lmStudioManager.getModelInfo(modelId);
        res.json(modelInfo);
    } catch (error) {
        console.error('Error checking model:', error);
        res.status(500).json({ error: 'Failed to check model' });
    }
});

router.get('/models', async (req, res) => {
    try {
        const availableModels = await lmStudioManager.listAvailableModels();
        res.json(availableModels);
    } catch (error) {
        console.error('Error listing models:', error);
        res.status(500).json({ error: 'Failed to list models' });
    }
});

router.post('/models/:modelId/load', async (req, res) => {
    const { modelId } = req.params;
    try {
        await lmStudioManager.getOrLoadModel(modelId);
        res.json({ message: `Model ${modelId} loaded successfully` });
    } catch (error) {
        console.error('Error loading model:', error);
        res.status(500).json({ error: 'Failed to load model' });
    }
});

router.post('/models/:modelId/unload', async (req, res) => {
    const { modelId } = req.params;
    try {
        await lmStudioManager.unloadModel(modelId);
        res.json({ message: `Model ${modelId} unloaded successfully` });
    } catch (error) {
        console.error('Error unloading model:', error);
        res.status(500).json({ error: 'Failed to unload model' });
    }
});

router.post('/v1/completions', async (req, res) => {
    const params = req.body as CompletionParams;
    try {
        if (!params) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        const completionResult = await lmStudioManager.generateCompletion(params);
        if (params.stream) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            });
            if (completionResult instanceof Stream) {
                for await (const chunk of completionResult) {
                    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                }
                res.write('data: [DONE]\n\n');
            } else {
                res.write(`data: ${JSON.stringify(completionResult)}\n\n`);
                res.write('data: [DONE]\n\n');
            }
            res.end();
        } else {
            res.json(completionResult);
        }
    } catch (error) {
        console.error('Error generating completion:', error);
        res.status(500).json({ error: 'Failed to generate completion' });
    }
});

export default router;
import express, { Router, Response } from 'express';
import auth from '../middleware/auth.middleware';
import Logger from '../utils/logger';
import { AuthRequest } from '../interfaces/auth.interface';
import { ChatCompletionParams, CompletionParams } from '../lmStudioManager/lmStudio.types';
import { LMStudioRouteManager } from '../lmStudioManager/lmStudioOrchestrator';
import { CreateEmbeddingParams } from '../lmStudioManager/lmStudio.utils';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';

const router: Router = express.Router();
const lmStudioManager = new LMStudioRouteManager();
// Initialize LMStudioRouteManager
(async () => {
  try {
      await lmStudioManager.initialize();
  } catch (error) {
      Logger.error('Failed to initialize LMStudioRouteManager:', error);
      process.exit(1);
  }
})();

// Error handling helper
const handleErrors = (res: Response, error: any) => {
  Logger.error('Error in LM Studio route:', error);
  const message = error.message || 'An error occurred while processing the request';
  const status = error.status || 500;
  res.status(status).json({ error: message });
};

// All routes require authentication
router.use(rateLimiterMiddleware);
router.use(auth); // TODO: Switch completion endpoints to workflowAuth middleware

// List all available models
router.get('/v1/models', async (_req: AuthRequest, res: Response) => {
  try {
    const models = await lmStudioManager.listModels();
    res.json({
      object: 'list',
      data: models.map(model => ({
        id: model.path,
        architecture: model.architecture,
        size: model.sizeBytes,
        type: model.type,
        is_loaded: model.isLoaded
      }))
    });
  } catch (error) {
    handleErrors(res, error);
  }
});

// Helper to encode/decode model IDs
const encodeModelPath = (modelPath: string): string => {
  return encodeURIComponent(modelPath);
};

// Helper function to construct the URL for unloading a model
export const getUnloadModelUrl = (modelPath: string): string => {
  const encodedPath = encodeModelPath(modelPath);
  return `/v1/models/unload/${encodedPath}`;
};

router.post('/v1/models/unload/**', async (req: AuthRequest, res: Response) => {
  try {
    const modelId = req.params[0];
    if (!modelId) {
      return res.status(400).json({ error: 'model_id parameter is required' });
    }

    await lmStudioManager.unloadModel(modelId);
    res.json({
      success: true,
      message: `Model ${modelId} has been queued for unloading`
    });
  } catch (error) {
    handleErrors(res, error);
  }
});
// Chat completions endpoint
router.post('/v1/chat/completions', async (req: AuthRequest, res: Response) => {
  try {
    const params: ChatCompletionParams = req.body;
    const modelId = params.model as string;

    if (!modelId) {
      return res.status(400).json({ error: 'model parameter is required' });
    }

    if (!params.messages || params.messages.length === 0) {
      return res.status(400).json({ error: 'messages are required in the request body' });
    }

    // Handle streaming response
    if (params.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await lmStudioManager.generateChatCompletion(modelId, params);
      
      if (stream instanceof ReadableStream) {
        // Handle streaming response
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.write('data: [DONE]\n\n');
              break;
            }
            res.write(value);
          }
        } finally {
          reader.releaseLock();
          res.end();
        }
      }
    } else {
      // Handle regular response
      const response = await lmStudioManager.generateChatCompletion(modelId, params);
      res.json(response);
    }
  } catch (error) {
    handleErrors(res, error);
  }
});

// Completions endpoint
router.post('/v1/completions', async (req: AuthRequest, res: Response) => {
  try {
    const params: CompletionParams = req.body;
    const modelId = params.model as string;

    if (!modelId) {
      return res.status(400).json({ error: 'model_id query parameter is required' });
    }

    if (!params.prompt) {
      return res.status(400).json({ error: 'prompt is required in the request body' });
    }

    // Handle streaming response
    if (params.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await lmStudioManager.generateCompletion(modelId, params);
      
      if (stream instanceof ReadableStream) {
        // Handle streaming response
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.write('data: [DONE]\n\n');
              break;
            }
            res.write(value);
          }
        } finally {
          reader.releaseLock();
          res.end();
        }
      }
    } else {
      // Handle regular response
      const response = await lmStudioManager.generateCompletion(modelId, params);
      res.json(response);
    }
  } catch (error) {
    handleErrors(res, error);
  }
});

// Embeddings endpoint
router.post('/v1/embeddings', async (req: AuthRequest, res: Response) => {
  try {
    const params: CreateEmbeddingParams = req.body;
    const modelId = params.model as string;

    if (!modelId) {
      return res.status(400).json({ error: 'model_id query parameter is required' });
    }

    if (!params.input) {
      return res.status(400).json({ error: 'input is required in the request body' });
    }

    const response = await lmStudioManager.generateEmbedding(modelId, params);
    res.json(response);
  } catch (error) {
    handleErrors(res, error);
  }
});

// Cleanup handler for graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await lmStudioManager.shutdown();
    Logger.info('LM Studio manager shut down successfully');
  } catch (error) {
    Logger.error('Error during LM Studio manager shutdown:', error);
  }
});

export default router;
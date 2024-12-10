import { createRoutes } from '../utils/routeGenerator';
import EmbeddingChunk from '../models/embeddingChunk.model';
import auth from '../middleware/auth.middleware';
import { IEmbeddingChunkDocument } from '../interfaces/embeddingChunk.interface';
import { Router } from 'express';
import { createEmbeddingChunk, updateEmbeddingChunk } from '../utils/embeddingChunk.utils';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';

const router = Router();
router.use(auth);
router.use(rateLimiterMiddleware);
const generatedRoutes = createRoutes<IEmbeddingChunkDocument, 'EmbeddingChunk'>(EmbeddingChunk, 'EmbeddingChunk', {
    createItem: async (data, userId) => {
        return await createEmbeddingChunk(data, userId);
    },
    updateItem: async (id, data, userId) => {
        return await updateEmbeddingChunk(id, data, userId);
    }
});
router.use('/', generatedRoutes);

export default router;
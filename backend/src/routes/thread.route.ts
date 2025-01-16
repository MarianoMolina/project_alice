import { createRoutes } from '../utils/routeGenerator';
import auth from '../middleware/auth.middleware';
import { Router } from 'express';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';
import { IChatThreadDocument } from '../interfaces/thread.interface';
import { ChatThread } from '../models/thread.model';
import { createChatThread, updateChatThread } from '../utils/thread.utils';

const router = Router();
router.use(rateLimiterMiddleware);
router.use(auth);
const ChatThreadRoutes = createRoutes<IChatThreadDocument, 'ChatThread'>(ChatThread, 'ChatThread', {
  createItem: async (data, userId) => {
    return await createChatThread(data, userId);
  },
  updateItem: async (id, data, userId) => {
    return await updateChatThread(id, data, userId);
  },
});

router.use('/', ChatThreadRoutes);

export default router;
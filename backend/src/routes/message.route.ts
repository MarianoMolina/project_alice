import { createRoutes } from '../utils/routeGenerator';
import Message from '../models/message.model';
import { createMessage, updateMessage } from '../utils/message.utils';
import auth from '../middleware/auth.middleware';
import { IMessageDocument } from '../interfaces/message.interface';
import { Router } from 'express';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';

const router = Router();
router.use(auth);
router.use(rateLimiterMiddleware);
const MessageRoutes = createRoutes<IMessageDocument, 'Message'>(Message, 'Message', {
  createItem: async (data, userId) => {
    return await createMessage(data, userId);
  },
  updateItem: async (id, data, userId) => {
    return await updateMessage(id, data, userId);
  }
});

router.use('/', MessageRoutes);

export default router;
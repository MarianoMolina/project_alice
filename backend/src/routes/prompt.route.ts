import { createRoutes } from '../utils/routeGenerator';
import Prompt from '../models/prompt.model';
import auth from '../middleware/auth.middleware';
import { IPromptDocument } from '../interfaces/prompt.interface';
import { Router } from 'express';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';

const router = Router();
router.use(rateLimiterMiddleware);
router.use(auth);
const generatedRoutes = createRoutes<IPromptDocument, 'Prompt'>(
    Prompt, 
    'Prompt',
    {
      updateItem: async (id, data, userId) => {
        if (!data.is_templated) {
          data.parameters = null;
        }
        return Prompt.findOneAndUpdate(
          { _id: id, created_by: userId },
          { $set: data },
          { new: true, runValidators: true }
        );
      }
    }
  );
router.use('/', generatedRoutes);

export default router;
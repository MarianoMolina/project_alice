import { Router } from 'express';
import { createRoutes } from '../utils/routeGenerator';
import EntityReference from '../models/entityReference.model';
import auth from '../middleware/auth.middleware';
import { IEntityReferenceDocument } from '../interfaces/entityReference.interface';
import { createEntityReference, updateEntityReference } from '../utils/entityReference.utils';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';

const router = Router();
router.use(auth);
router.use(rateLimiterMiddleware);

const generatedRoutes = createRoutes<IEntityReferenceDocument, 'EntityReference'>(
  EntityReference,
  'EntityReference',
  {
    createItem: async (data, userId) => {
      return await createEntityReference(data, userId);
    },
    updateItem: async (id, data, userId) => {
      return await updateEntityReference(id, data, userId);
    }
  }
);

router.use('/', generatedRoutes);

export default router;
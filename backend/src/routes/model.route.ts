import { createRoutes } from '../utils/routeGenerator';
import Model from '../models/model.model';
import auth from '../middleware/auth.middleware';
import { IModelDocument } from '../interfaces/model.interface';
import { Router } from 'express';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';

const router = Router();
router.use(auth);
router.use(rateLimiterMiddleware);
const generatedRoutes = createRoutes<IModelDocument, 'Model'>(Model, 'Model');
router.use('/', generatedRoutes);

export default router;
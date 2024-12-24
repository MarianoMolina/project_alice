import { createRoutes } from '../utils/routeGenerator';
import APIConfig from '../models/apiConfig.model';
import auth from '../middleware/auth.middleware';
import { IAPIConfigDocument } from '../interfaces/apiConfig.interface';
import { Router } from 'express';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';

const router = Router();
router.use(rateLimiterMiddleware);
router.use(auth);
const generatedRoutes = createRoutes<IAPIConfigDocument, 'APIConfig'>(APIConfig, 'APIConfig');
router.use('/', generatedRoutes);

export default router;
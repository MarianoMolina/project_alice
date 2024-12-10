import { createRoutes } from '../utils/routeGenerator';
import { Router } from 'express';
import API from '../models/api.model';
import auth from '../middleware/auth.middleware';
import { IAPIDocument } from '../interfaces/api.interface';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';

const router = Router();
router.use(auth);
router.use(rateLimiterMiddleware);
const generatedRoutes  = createRoutes<IAPIDocument, 'API'>(API, 'API');
router.use('/', generatedRoutes);

export default router;
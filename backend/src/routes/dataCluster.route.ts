import { createRoutes } from '../utils/routeGenerator';
import { Router } from 'express';
import auth from '../middleware/auth.middleware';
import { IDataClusterDocument } from '../interfaces/references.interface';
import { DataCluster } from '../models/reference.model';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';

const router = Router();
router.use(auth);
router.use(rateLimiterMiddleware);
const generatedRoutes  = createRoutes<IDataClusterDocument, 'DataCluster'>(DataCluster, 'DataCluster');
router.use('/', generatedRoutes);

export default router;
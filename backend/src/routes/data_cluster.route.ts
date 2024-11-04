import { createRoutes } from '../utils/routeGenerator';
import { Router } from 'express';
import auth from '../middleware/auth.middleware';
import { IDataClusterDocument } from '../interfaces/references.interface';
import { DataCluster } from '../models/reference.model';

const router = Router();
router.use(auth);
const generatedRoutes  = createRoutes<IDataClusterDocument, 'DataCluster'>(DataCluster, 'DataCluster');
router.use('/', generatedRoutes);

export default router;
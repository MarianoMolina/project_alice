import { createRoutes } from '../utils/routeGenerator';
import { Router } from 'express';
import API from '../models/api.model';
import auth from '../middleware/auth.middleware';
import { IAPIDocument } from '../interfaces/api.interface';

const router = Router();
router.use(auth);
const generatedRoutes  = createRoutes<IAPIDocument, 'API'>(API, 'API');
router.use('/', generatedRoutes);

export default router;
import { createRoutes } from '../utils/routeGenerator';
import Model from '../models/model.model';
import auth from '../middleware/auth.middleware';
import { IModelDocument } from '../interfaces/model.interface';
import { Router } from 'express';

const router = Router();
router.use(auth);
const generatedRoutes = createRoutes<IModelDocument, 'Model'>(Model, 'Model');
router.use('/', generatedRoutes);

export default router;
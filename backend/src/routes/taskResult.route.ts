import { createRoutes } from '../utils/routeGenerator';
import TaskResult from '../models/taskResult.model';
import auth from '../middleware/auth.middleware';
import { ITaskResultDocument } from '../interfaces/taskResult.interface';
import { Router } from 'express';

const router = Router();
router.use(auth);
const generatedRoutes = createRoutes<ITaskResultDocument, 'TaskResult'>(TaskResult, 'TaskResult');
router.use('/', generatedRoutes);

export default router;
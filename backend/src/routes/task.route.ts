import { createRoutes } from '../utils/routeGenerator';
import Task from '../models/task.model';
import auth from '../middleware/auth.middleware';
import { ITaskDocument } from '../interfaces/task.interface';
import { Router } from 'express';

const router = Router();
router.use(auth);
const generatedRoutes = createRoutes<ITaskDocument, 'Task'>(Task, 'Task');
router.use('/', generatedRoutes);

export default router;
import { createRoutes } from '../utils/routeGenerator';
import TaskResult from '../models/taskResult.model';
import auth from '../middleware/auth.middleware';
import { ITaskResultDocument } from '../interfaces/taskResult.interface';
import { Router } from 'express';
<<<<<<< HEAD

const router = Router();
router.use(auth);
const generatedRoutes = createRoutes<ITaskResultDocument, 'TaskResult'>(TaskResult, 'TaskResult');
router.use('/', generatedRoutes);
=======
import { createTaskResult, updateTaskResult } from '../utils/taskResult.utils';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth);

// Generate routes with custom create and update methods
const taskResultRoutes = createRoutes<ITaskResultDocument, 'TaskResult'>(TaskResult, 'TaskResult', {
  createItem: async (data, userId) => {
    return await createTaskResult(data, userId);
  },
  updateItem: async (id, data, userId) => {
    return await updateTaskResult(id, data, userId);
  }
});

// Use the generated routes
router.use('/', taskResultRoutes);
>>>>>>> development

export default router;
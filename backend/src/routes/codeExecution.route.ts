import { createRoutes } from '../utils/routeGenerator';
import auth from '../middleware/auth.middleware';
import { Router } from 'express';
import { ICodeExecutionDocument } from '../interfaces/codeExecution.interface';
import CodeExecution from '../models/codeExecution.model';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';

const router = Router();
router.use(rateLimiterMiddleware);
router.use(auth);
const generatedRoutes = createRoutes<ICodeExecutionDocument, 'CodeExecution'>(CodeExecution, 'CodeExecution');
router.use('/', generatedRoutes);

export default router;
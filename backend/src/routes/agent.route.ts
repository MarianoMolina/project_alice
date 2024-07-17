import { Router } from 'express';
import { createRoutes } from '../utils/routeGenerator';
import Agent from '../models/agent.model';
import auth from '../middleware/auth.middleware';
import { IAgentDocument } from '../interfaces/agent.interface';

const router = Router();
router.use(auth);
const generatedRoutes = createRoutes<IAgentDocument, 'Agent'>(Agent, 'Agent');
router.use('/', generatedRoutes);

export default router;
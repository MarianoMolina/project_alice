import { createRoutes } from '../utils/routeGenerator';
import Prompt from '../models/prompt.model';
import auth from '../middleware/auth.middleware';
import { IPromptDocument } from '../interfaces/prompt.interface';
import { Router } from 'express';

const router = Router();
router.use(auth);
const generatedRoutes = createRoutes<IPromptDocument, 'Prompt'>(Prompt, 'Prompt');
router.use('/', generatedRoutes);

export default router;
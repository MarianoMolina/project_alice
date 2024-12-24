import { createRoutes } from '../utils/routeGenerator';
import ParameterDefinition from '../models/parameter.model';
import auth from '../middleware/auth.middleware';
import { IParameterDefinitionDocument } from '../interfaces/parameter.interface';
import { Router } from 'express';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';

const router = Router();
router.use(rateLimiterMiddleware);
router.use(auth);
const generatedRoutes = createRoutes<IParameterDefinitionDocument, 'ParameterDefinition'>(ParameterDefinition, 'ParameterDefinition');
router.use('/', generatedRoutes);

export default router;
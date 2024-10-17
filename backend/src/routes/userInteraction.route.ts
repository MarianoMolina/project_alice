import { createRoutes } from '../utils/routeGenerator';
import UserInteraction from '../models/userInteraction.model';
import auth from '../middleware/auth.middleware';
import { IUserInteractionDocument } from '../interfaces/userInteraction.interface';
import { Router } from 'express';

const router = Router();
router.use(auth);
const generatedRoutes = createRoutes<IUserInteractionDocument, 'UserInteraction'>(UserInteraction, 'UserInteraction');
router.use('/', generatedRoutes);

export default router;
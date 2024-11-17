import { createRoutes } from '../utils/routeGenerator';
import auth from '../middleware/auth.middleware';
import { Router } from 'express';
import { IToolCallDocument } from '../interfaces/toolCall.interface';
import ToolCall from '../models/toolCall.model';

const router = Router();
router.use(auth);
const generatedRoutes = createRoutes<IToolCallDocument, 'ToolCall'>(ToolCall, 'ToolCall');
router.use('/', generatedRoutes);

export default router;
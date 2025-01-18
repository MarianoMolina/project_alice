import { Response, Router } from 'express';
import API from '../models/api.model';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';
import { AuthRequest } from '../interfaces/auth.interface';
import Logger from '../utils/logger';
import workflowAuth from '../middleware/workflowAuth.middleware';
import AliceChat from '../models/chat.model';
import { defaultPopulationConfig, PopulationService } from '../utils/population.utils';
import { Types } from 'mongoose';

const router = Router();
router.use(rateLimiterMiddleware);
router.use(workflowAuth);
router.get('/api_request', async (req: AuthRequest, res: Response) => {
    try {
        const apis = await API.find({ created_by: req.effectiveUserId });
        return res.status(200).json({ message: 'Success', apis });
    } catch (error) {
        Logger.error('Error in add_message route:', {
            error: (error as Error).message,
            stack: (error as Error).stack
        });
        res.status(500).json({ message: (error as Error).message, stack: (error as Error).stack });
    }
});

router.get('/chat_without_threads/:chatId', async (req: AuthRequest, res: Response) => {
    const { chatId } = req.params;
    if (!req.effectiveUserId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const popConfig = {
            ...defaultPopulationConfig,
            hasDataCluster: true,
            hasTasks: true,
            taskPath: ['agent_tools', 'retrieval_tools'],
            hasThreads: false,
        }
        const popService = new PopulationService()
        const chat = await popService.findAndPopulate(
            AliceChat,
            chatId,
            req.effectiveUserId,
            popConfig
        );
        return res.status(200).json({ message: 'Success', chat });
    } catch (error) {
        Logger.error('Error in add_message route:', {
            error: (error as Error).message,
            stack: (error as Error).stack
        });
        res.status(500).json({ message: (error as Error).message, stack: (error as Error).stack });
    }
});
export default router;
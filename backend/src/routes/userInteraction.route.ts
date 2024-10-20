import { createRoutes } from '../utils/routeGenerator';
import UserInteraction from '../models/userInteraction.model';
import auth from '../middleware/auth.middleware';
import { IUserInteractionDocument } from '../interfaces/userInteraction.interface';
import { Router } from 'express';
import { createUserInteraction, updateUserInteraction } from '../utils/userInteraction.utils';

const router = Router();
router.use(auth);
const generatedRoutes = createRoutes<IUserInteractionDocument, 'UserInteraction'>(UserInteraction, 'UserInteraction', {
    createItem: async (data, userId) => {
        return await createUserInteraction(data, userId);
    },
    updateItem: async (id, data, userId) => {
        return await updateUserInteraction(id, data, userId);
    }
});
router.use('/', generatedRoutes);

export default router;
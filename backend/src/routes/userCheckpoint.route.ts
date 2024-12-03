import { createRoutes } from '../utils/routeGenerator';
import UserCheckpoint from '../models/userCheckpoint.model';
import auth from '../middleware/auth.middleware';
import { IUserCheckpointDocument } from '../interfaces/userCheckpoint.interface';
import { Router } from 'express';
import { createUserCheckpoint, updateUserCheckpoint } from '../utils/userCheckpoint.utils';

const router = Router();
router.use(auth);
const generatedRoutes = createRoutes<IUserCheckpointDocument, 'UserCheckpoint'>(UserCheckpoint, 'UserCheckpoint', {
    createItem: async (data, userId) => {
        return await createUserCheckpoint(data, userId);
    },
    updateItem: async (id, data, userId) => {
        return await updateUserCheckpoint(id, data, userId);
    }
});
router.use('/', generatedRoutes);

export default router;
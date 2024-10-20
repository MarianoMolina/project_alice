import { createRoutes } from '../utils/routeGenerator';
import URLReference from '../models/urlReference.model';
import auth from '../middleware/auth.middleware';
import { IURLReferenceDocument } from '../interfaces/urlReference.interface';
import { Router } from 'express';
import { createURLReference, updateURLReference } from '../utils/urlReference.utils';

const router = Router();
router.use(auth);
const generatedRoutes = createRoutes<IURLReferenceDocument, 'URLReference'>(URLReference, 'URLReference', {
    createItem: async (data, userId) => {
        return await createURLReference(data, userId);
    },
    updateItem: async (id, data, userId) => {
        return await updateURLReference(id, data, userId);
    }
});
router.use('/', generatedRoutes);

export default router;
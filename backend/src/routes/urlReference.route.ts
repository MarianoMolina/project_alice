import { createRoutes } from '../utils/routeGenerator';
import URLReference from '../models/urlReference.model';
import auth from '../middleware/auth.middleware';
import { IURLReferenceDocument } from '../interfaces/urlReference.interface';
import { Router } from 'express';

const router = Router();
router.use(auth);
const generatedRoutes = createRoutes<IURLReferenceDocument, 'URLReference'>(URLReference, 'URLReference');
router.use('/', generatedRoutes);

export default router;
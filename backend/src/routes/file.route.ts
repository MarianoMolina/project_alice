import express, { Router, Response } from 'express';
import { AuthRequest } from '../interfaces/auth.interface';
import auth from '../middleware/auth.middleware';
import FileReference from '../models/file.model';
import { storeFileReference, updateFile, retrieveFileById, deleteFile } from '../utils/file.utils';
import { IFileReference, IFileReferenceDocument } from '../interfaces/file.interface';
import { getObjectId } from '../utils/utils';
import { createRoutes } from '../utils/routeGenerator';
import Logger from '../utils/logger';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';

// Create a router using routeGenerator for common CRUD routes
const generatedRouter = createRoutes<IFileReferenceDocument, 'FileReference'>(FileReference, 'FileReference', {
  createItem: async (data, userId) => {
    return await storeFileReference(data as IFileReference, userId);
  },
  updateItem: async (id, data, userId) => {
    return await updateFile(id, data, userId);
  },
  deleteItem: async (id, userId) => {
    return await deleteFile(id, userId);
  }
});

// Custom route definitions
const customRouter = Router();

customRouter.get('/serve/:id', async (req: AuthRequest, res: Response) => {
  try {
    const version = req.query.version ? parseInt(req.query.version as string) : undefined;
    const { file, fileReference } = await retrieveFileById(req.params.id, version);

    if (getObjectId(fileReference.created_by).toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    res.set('Content-Type', fileReference.type);
    res.set('Content-Disposition', `attachment; filename="${fileReference.filename}"`);
    res.send(file);
  } catch (error) {
    Logger.error('Error serving file:', error);
    res.status(404).json({ message: 'File not found' });
  }
});

// Combine generated and custom routes
const combinedRouter = Router();
combinedRouter.use(auth); // Apply auth middleware to all routes
combinedRouter.use(rateLimiterMiddleware);
combinedRouter.use('/', generatedRouter);
combinedRouter.use('/', customRouter);

export default combinedRouter;
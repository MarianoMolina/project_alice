import express, { Router, Response } from 'express';
import { AuthRequest } from '../interfaces/auth.interface';
import auth from '../middleware/auth.middleware';
import FileReference from '../models/file.model';
import { storeFileReference, updateFile, retrieveFileById } from '../utils/file.utils';
import { IFileReference, IFileReferenceDocument } from '../interfaces/file.interface';
import Logger from '../utils/logger';

const router: Router = express.Router();

router.use(auth);

router.post('/upload', async (req: AuthRequest, res: Response) => {
    try {
        const fileContent: IFileReference = req.body;
        const userId = req.user!.userId;
        if (!fileContent || !fileContent.filename || !fileContent.type || !fileContent.content) {
            return res.status(400).json({ message: 'Invalid file data' });
        }
        const fileReference = await storeFileReference(fileContent, userId);
        res.status(201).json(fileReference);
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Error uploading file' });
    }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const fileReference = await FileReference.findById(req.params.id);
        if (!fileReference) {
            return res.status(404).json({ message: 'File not found' });
        }
        if (fileReference.created_by._id.toString() !== req.user!.userId) {
            return res.status(403).json({ message: 'Unauthorized userId ' + req.user!.userId + ' fileReference.created_by ' + fileReference.created_by.toString() });
        }
        res.json(fileReference);
    } catch (error) {
        console.error('Error retrieving file reference:', error);
        res.status(500).json({ message: 'Error retrieving file reference' });
    }
});

router.get('/serve/:id', async (req: AuthRequest, res: Response) => {
    try {
        const version = req.query.version ? parseInt(req.query.version as string) : undefined;
        const { file, fileReference } = await retrieveFileById(req.params.id, version);

        if (fileReference.created_by._id.toString() !== req.user!.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        res.set('Content-Type', fileReference.type);
        res.set('Content-Disposition', `attachment; filename="${fileReference.filename}"`);
        res.send(file);
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(404).json({ message: 'File not found' });
    }
});

router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const files = await FileReference.find({ created_by: req.user!.userId });
        res.json(files);
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ message: 'Error listing files' });
    }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        console.log('Raw request body:', JSON.stringify(req.body, null, 2));
        const fileId = req.params.id;
        const userId = req.user!.userId;
        const updateData: Partial<IFileReferenceDocument> = req.body;

        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No update data provided' });
        }

        Logger.info(`Updating file in route: ${fileId} with data: ${JSON.stringify(updateData)}`);

        const updatedFileReference = await updateFile(fileId, updateData, userId);
        res.json(updatedFileReference);
    } catch (error) {
        console.error('Error updating file:', error);
        res.status(500).json({ message: 'Error updating file' });
    }
});

export default router;
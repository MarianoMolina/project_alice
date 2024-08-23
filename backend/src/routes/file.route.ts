import express, { Router, Response } from 'express';
import { AuthRequest } from '../interfaces/auth.interface';
import auth from '../middleware/auth.middleware';
import FileReference from '../models/file.model';
import { storeFile, updateFile, retrieveFileById } from '../utils/file.utils';
import { FileContentReference } from '../interfaces/file.interface';

const router: Router = express.Router();

router.use(auth);

// POST /api/files/upload
router.post('/upload', async (req: AuthRequest, res: Response) => {
    try {
        const fileContent: FileContentReference = req.body;
        const userId = req.user!.userId;

        if (!fileContent || !fileContent.filename || !fileContent.type || !fileContent.content) {
            return res.status(400).json({ message: 'Invalid file data' });
        }

        const fileReference = await storeFile(fileContent, userId);
        res.status(201).json(fileReference.apiRepresentation());
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Error uploading file' });
    }
});

// GET /api/files/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const fileReference = await FileReference.findById(req.params.id);
        if (!fileReference) {
            return res.status(404).json({ message: 'File not found' });
        }
        if (fileReference.created_by.toString() !== req.user!.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        res.json(fileReference.apiRepresentation());
    } catch (error) {
        console.error('Error retrieving file reference:', error);
        res.status(500).json({ message: 'Error retrieving file reference' });
    }
});

// GET /api/files/serve/:id
router.get('/serve/:id', async (req: AuthRequest, res: Response) => {
    try {
        const version = req.query.version ? parseInt(req.query.version as string) : undefined;
        const { file, fileReference } = await retrieveFileById(req.params.id, version);
        
        if (fileReference.created_by.toString() !== req.user!.userId) {
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

// GET /api/files
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const files = await FileReference.find({ created_by: req.user!.userId });
        res.json(files.map(file => file.apiRepresentation()));
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ message: 'Error listing files' });
    }
});

// PATCH /api/files/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const fileContent: FileContentReference = req.body;
        const userId = req.user!.userId;

        if (!fileContent || !fileContent.filename || !fileContent.type || !fileContent.content) {
            return res.status(400).json({ message: 'Invalid file data' });
        }

        fileContent._id = req.params.id;

        const updatedFileReference = await updateFile(fileContent, userId);
        res.json(updatedFileReference.apiRepresentation());
    } catch (error) {
        console.error('Error updating file:', error);
        res.status(500).json({ message: 'Error updating file' });
    }
});

export default router;
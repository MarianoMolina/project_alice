import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { AuthRequest } from '../interfaces/auth.interface';
import auth from '../middleware/auth.middleware';
import { storeFile, retrieveFile, retrieveFileByName, inferContentType } from '../utils/file.utils';
import FileReference from '../models/file.model';

const router: Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(auth);

router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
  
      // Infer the content type from the file
      const contentType = inferContentType(req.file.originalname);
  
      const fileReference = await storeFile(req.file, req.user!.userId, contentType);
      res.status(201).json(fileReference.apiRepresentation());
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Error uploading file' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { file, fileReference } = await retrieveFile(req.params.id);
        res.set({
            'Content-Type': fileReference.type,
            'Content-Disposition': `attachment; filename="${fileReference.filename}"`
        });
        res.send(file);
    } catch (error) {
        console.error('Error retrieving file:', error);
        res.status(404).json({ message: 'File not found' });
    }
});

router.get('/serve/:fileName', async (req: Request, res: Response) => {
    try {
        const { file, fileReference } = await retrieveFileByName(req.params.fileName);
        res.set({
            'Content-Type': fileReference.type,
            'Content-Disposition': `inline; filename="${fileReference.filename}"`
        });
        res.send(file);
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(404).json({ message: 'File not found' });
    }
});

router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const files = await FileReference.find({ created_by: req.user!.userId });
        res.json(files.map(file => file.apiRepresentation()));
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ message: 'Error listing files' });
    }
});

export default router;
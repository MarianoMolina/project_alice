import express, { Router, Response } from 'express';
import API from '../models/api.model';
import auth from '../middleware/auth.middleware';
import { AuthRequest } from '../interfaces/auth.interface';

const router: Router = express.Router();

// Create a new Api
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const api = new API({
      ...req.body,
      created_by: req.user?.userId,
      updated_by: req.user?.userId
    });
    await api.save();
    res.status(201).json(api);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

// Get all Apis
router.get('/', auth, async (_req: AuthRequest, res: Response) => {
  try {
    const api = await API.find();
    res.status(200).json(api);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Get a Api by ID
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const api = await API.findById(req.params.id);
    if (!api) {
      return res.status(404).json({ message: 'Api not found' });
    }
    res.status(200).json(api);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Update a Api by ID
router.patch('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const updatedApi = await API.findOneAndUpdate(
      { _id: req.params.id },
      {
        ...req.body,
        updated_by: req.user?.userId
      },
      {
        new: true,
        runValidators: true
      }
    );
    if (!updatedApi) {
      return res.status(404).json({ message: 'Api not found' });
    }
    res.status(200).json(updatedApi);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

// Delete a Api by ID
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const api = await API.findByIdAndDelete(req.params.id);
    if (!api) {
      return res.status(404).json({ message: 'Api not found' });
    }
    res.status(200).json({ message: 'Api deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
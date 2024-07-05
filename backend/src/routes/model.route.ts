import express, { Router, Response } from 'express';
import Model from '../models/model.model';
import auth from '../middleware/auth.middleware';
import { AuthRequest } from '../interfaces/auth.interface';

const router: Router = express.Router();

// Create a new Model
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const model = new Model({
      ...req.body,
      created_by: req.user?.userId,
      updated_by: req.user?.userId
    });
    await model.save();
    res.status(201).json(model);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

// Get all Models
router.get('/', auth, async (_req: AuthRequest, res: Response) => {
  try {
    const models = await Model.find();
    res.status(200).json(models);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Get a Model by ID
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const model = await Model.findById(req.params.id);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    res.status(200).json(model);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Update a Model by ID
router.patch('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const updatedModel = await Model.findOneAndUpdate(
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
    if (!updatedModel) {
      return res.status(404).json({ message: 'Model not found' });
    }
    res.status(200).json(updatedModel);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

// Delete a Model by ID
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const model = await Model.findByIdAndDelete(req.params.id);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    res.status(200).json({ message: 'Model deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
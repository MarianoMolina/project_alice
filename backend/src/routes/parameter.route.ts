import express, { Router, Response } from 'express';
import ParameterDefinition from '../models/parameter.model';
import auth from '../middleware/auth.middleware';
import { AuthRequest } from '../interfaces/auth.interface';

const router: Router = express.Router();

// Create a new parameter
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const parameter = new ParameterDefinition({
      ...req.body,
      created_by: req.user?.userId,
      updated_by: req.user?.userId
    });
    await parameter.save();
    res.status(201).json(parameter);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get all parameters
router.get('/', auth, async (_req: AuthRequest, res: Response) => {
  try {
    const parameters = await ParameterDefinition.find();
    res.json(parameters);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get a parameter by ID
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const parameter = await ParameterDefinition.findById(req.params.id);
    if (!parameter) {
      return res.status(404).json({ error: 'Parameter not found' });
    }
    res.json(parameter);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update a parameter by ID
router.patch('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const updatedParameter = await ParameterDefinition.findOneAndUpdate(
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

    if (!updatedParameter) {
      return res.status(404).json({ error: 'Parameter not found' });
    }

    res.json(updatedParameter);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Delete a parameter by ID
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const parameter = await ParameterDefinition.findByIdAndDelete(req.params.id);
    if (!parameter) {
      return res.status(404).json({ error: 'Parameter not found' });
    }
    res.json(parameter);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
import express, { Router, Response } from 'express';
import Prompt from '../models/prompt.model';
import auth from '../middleware/auth.middleware';
import { AuthRequest } from '../interfaces/auth.interface';

const router: Router = express.Router();

// Create a new prompt
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const prompt = new Prompt({
      ...req.body,
      created_by: req.user?.userId,
      updated_by: req.user?.userId
    });
    await prompt.save();
    res.status(201).json(prompt);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get all prompts
router.get('/', auth, async (_req: AuthRequest, res: Response) => {
  try {
    const prompts = await Prompt.find();
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get a prompt by ID
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update a prompt by ID
router.patch('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const updatedPrompt = await Prompt.findOneAndUpdate(
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
    if (!updatedPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json(updatedPrompt);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Delete a prompt by ID
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const prompt = await Prompt.findByIdAndDelete(req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
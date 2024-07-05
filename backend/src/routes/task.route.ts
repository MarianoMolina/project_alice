import express, { Router, Response } from 'express';
import Task from '../models/task.model';
import auth from '../middleware/auth.middleware';
import { AuthRequest } from '../interfaces/auth.interface';

const router: Router = express.Router();

// Create a new Task
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const task = new Task({
      ...req.body,
      created_by: req.user?.userId,
      updated_by: req.user?.userId
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

// Get all Tasks
router.get('/', auth, async (_req: AuthRequest, res: Response) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Get a Task by ID
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Update a Task by ID
router.patch('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    Object.assign(task, req.body, { updated_by: req.user?.userId });
    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

// Delete a Task by ID
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
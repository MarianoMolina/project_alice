import express, { Request, Response, Router } from 'express';
import Agent from '../models/agent.model';
import auth from '../middleware/auth.middleware';
import { AuthRequest } from '../interfaces/auth.interface';

const router: Router = express.Router();

// Create a new Agent
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  const user_id = req.user?.userId;
  try {
    const agent = new Agent({
      ...req.body,
      created_by: user_id,
      updated_by: user_id
    });
    await agent.save();
    res.status(201).json(agent);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get all Agents
router.get('/', auth, async (_req: Request, res: Response) => {
  try {
    const agents = await Agent.find();
    res.status(200).json(agents);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get an Agent by ID
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.status(200).json(agent);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update an Agent by ID
router.patch('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    Object.assign(agent, req.body, { updated_by: req.user?.userId });
    await agent.save();
    res.status(200).json(agent);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Delete an Agent by ID
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const agent = await Agent.findByIdAndDelete(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.status(200).json({ message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
import express, { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.middleware';
import adminOnly from '../middleware/admin.middleware';
import User from '../models/user.model';
import { AuthRequest } from '../interfaces/auth.interface';
import axios from 'axios';
import Logger from '../utils/logger';
import { purgeAndReinitialize } from '../utils/purge.utils';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';
import { JWT_SECRET } from '../utils/const';

const router: Router = express.Router();

const handleErrors = (res: Response, error: any) => {
  Logger.error('Error in user route:', error);
  res.status(500).json({ error: 'An error occurred while processing the request' });
};

// Middleware to check if the user is accessing their own data or is an admin
const userSelfOrAdmin = (req: AuthRequest, res: Response, next: Function) => {
  if (req.user?.userId === req.params.id || req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Unauthorized' });
  }
};

// Public routes
router.use(rateLimiterMiddleware);

// Register a new user
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: role || 'user' });
    await user.save();
    res.status(201).json(user.apiRepresentation());
  } catch (error) {
    handleErrors(res, error);
  }
});

// Login a user
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    Logger.debug('Logging request with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    Logger.debug('User found:', JSON.stringify(user));
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    Logger.debug('Password matched for user:', user.email);
    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(
      payload,
      JWT_SECRET as string,
      { expiresIn: '30d' }
    );
    Logger.debug('User logged in:', user.email);
    res.status(200).json({ token, user: user.apiRepresentation() });
  } catch (error) {
    handleErrors(res, error);
  }
});

// Protected routes (require authentication)
router.use(auth);

// Validate user
router.get('/validate', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ valid: false, message: 'User not found' });
    }
    res.status(200).json({ valid: true, message: 'User is valid', user: user.apiRepresentation() });
  } catch (error) {
    handleErrors(res, error);
  }
});

// Get a specific user by ID (authenticated users can get their own info, admins can get any user's info)
router.get('/:id', userSelfOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.apiRepresentation());
  } catch (error) {
    handleErrors(res, error);
  }
});

// Update a user by ID (authenticated users can update their own info, admins can update any user's info)
router.patch('/:id', userSelfOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true, });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.apiRepresentation());
  } catch (error) {
    handleErrors(res, error);
  }
});

router.post('/purge-and-reinitialize', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: 'No authorization token provided' });
    }

    await purgeAndReinitialize(userId, token);

    res.json({ message: 'Database purged and re-initialized successfully' });
  } catch (error) {
    Logger.error('Error in purge-and-reinitialize:', error);
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json({ message: error.response?.data || 'An error occurred while reinitializing the database' });
    } else {
      handleErrors(res, error);
    }
  }
});

// Admin-only routes

// Get all users (admin only)
router.get('/', adminOnly, async (_req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users.map(user => user.apiRepresentation()));
  } catch (error) {
    handleErrors(res, error);
  }
});

// Delete a user by ID (admin only)
router.delete('/:id', adminOnly, async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    handleErrors(res, error);
  }
});

export default router;
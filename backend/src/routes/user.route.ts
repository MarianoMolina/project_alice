import express, { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.middleware';
import adminOnly from '../middleware/admin.middleware';
import User from '../models/user.model';
import { AuthRequest } from '../interfaces/auth.interface';

const router: Router = express.Router();

const handleErrors = (res: Response, error: any) => {
  console.error('Error in user route:', error);
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );
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
router.put('/:id', userSelfOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.apiRepresentation());
  } catch (error) {
    handleErrors(res, error);
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
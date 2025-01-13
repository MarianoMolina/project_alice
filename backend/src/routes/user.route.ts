import express, { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import auth from '../middleware/auth.middleware';
import adminOnly from '../middleware/admin.middleware';
import User from '../models/user.model';
import { AuthRequest } from '../interfaces/auth.interface';
import axios from 'axios';
import Logger from '../utils/logger';
import { purgeAndReinitialize } from '../utils/purge.utils';
import rateLimiterMiddleware from '../middleware/rateLimiter.middleware';
import { GOOGLE_CLIENT_ID } from '../utils/const';
import { createAuthResponse, googleClient } from '../utils/auth.utils';
import { ApiName } from '../interfaces/api.interface';
import { applyApiConfigFromMap, upsertApiConfigMap } from '../utils/structuredStorage.utils';
import { ApiConfigType } from '../interfaces/apiConfig.interface';
import { Types } from 'mongoose';
import StructuredStorage from '../models/structuredStorage.model';
import { StructureType } from '../interfaces/structuredStorage.interface';
import { createUserWithRole, UserStatsManager } from '../utils/user.utils';

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

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email: { $eq: email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUserWithRole({
      name,
      email,
      password: hashedPassword,
      creationMethod: 'password'
    });

    await UserStatsManager.recordLoginAttempt(user._id as string);
    await UserStatsManager.recordLoginSuccess(user._id as string);
    
    return res.status(201).json(createAuthResponse(user));
  } catch (error) {
    handleErrors(res, error);
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    Logger.debug('Log in request with email:', email);
    const user = await User.findOne({ email: { $eq: email } });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    UserStatsManager.recordLoginAttempt(user._id as string);

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    UserStatsManager.recordLoginSuccess(user._id as string);
    Logger.debug('User logged in:', user.email);
    return res.status(200).json(createAuthResponse(user));
  } catch (error) {
    handleErrors(res, error);
  }
});

router.post('/oauth/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    // Verify the Google token and get user info
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    // Find or create user
    let user = await User.findOne({ email: payload.email });
    const isNewUser = !user;

    if (!user) {
      // Create new user
      user = await createUserWithRole({
        name: payload.name || payload.email || 'Unknown User',
        email: payload.email,
        creationMethod: 'google'
      });
    }

    await UserStatsManager.recordLoginAttempt(user._id as string);
    await UserStatsManager.recordLoginSuccess(user._id as string);

    return res.status(200).json({
      ...createAuthResponse(user),
      isNewUser,
      message: isNewUser ? 'User registered successfully with Google' : 'User logged in successfully with Google'
    });
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

// Update user route
router.patch('/:id', userSelfOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updateFields = new Set(Object.keys(req.body));
    const schemaFields = new Set(Object.keys(User.schema.paths));

    // Remove fields that aren't in the schema
    const sanitizedData: Record<string, any> = {};
    for (const field of updateFields) {
      // Skip the role field unless user is admin
      if (field === 'role' && req.user?.role !== 'admin') {
        continue;
      }

      // Only include fields that exist in the schema
      if (schemaFields.has(field)) {
        sanitizedData[field] = req.body[field];
      }
    }

    // If there's nothing to update after sanitization
    if (Object.keys(sanitizedData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    // Handle password update separately to ensure hashing
    if (sanitizedData.password) {
      sanitizedData.password = await bcrypt.hash(sanitizedData.password, 10);
    }

    // Use $set to prevent operators injection
    const updateData = { $set: sanitizedData };

    // Perform the update with sanitized data
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

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

router.post(
  '/apply-api-config/:id',
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { mapName, apiNames } = req.body;
      const userId = req.params.id;

      if (!mapName || typeof mapName !== 'string') {
        return res.status(400).json({
          message: 'Invalid request: mapName must be provided'
        });
      }

      if (apiNames && (!Array.isArray(apiNames) || apiNames.length === 0)) {
        return res.status(400).json({
          message: 'Invalid request: if provided, apiNames must be a non-empty array'
        });
      }

      // Validate API names if provided
      if (apiNames) {
        const invalidNames = apiNames.filter((name: ApiName) => !Object.values(ApiName).includes(name));
        if (invalidNames.length > 0) {
          return res.status(400).json({
            message: `Invalid API names: ${invalidNames.join(', ')}`
          });
        }
      }

      await applyApiConfigFromMap(userId, mapName, apiNames);

      res.json({
        message: 'API configurations applied successfully',
        updatedMap: mapName,
        updatedApis: apiNames || 'all'
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ message: error.message });
        }
      }
      handleErrors(res, error);
    }
  }
);

router.post(
  '/update-api-config-map',
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { mapName, configs } = req.body;

      if (!mapName || typeof mapName !== 'string') {
        return res.status(400).json({
          message: 'Invalid request: mapName must be provided'
        });
      }

      if (!configs || typeof configs !== 'object') {
        return res.status(400).json({
          message: 'Invalid request: configs must be provided as an object'
        });
      }

      // Validate that all provided configs are for valid API names
      const invalidNames = Object.keys(configs).filter(
        name => !Object.values(ApiName).includes(name as ApiName)
      );
      if (invalidNames.length > 0) {
        return res.status(400).json({
          message: `Invalid API names in configs: ${invalidNames.join(', ')}`
        });
      }

      const updatedData = await upsertApiConfigMap(
        mapName,
        configs as Partial<{
          [K in ApiName]: ApiConfigType[K];
        }>,
        new Types.ObjectId(req.user!.userId)
      );

      res.json({
        message: 'API configuration map updated successfully',
        mapName,
        updatedConfigs: Object.keys(configs)
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid API configuration')) {
          return res.status(400).json({ message: error.message });
        }
      }
      handleErrors(res, error);
    }
  }
);

router.get(
  '/api-config-map/:mapName',
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { mapName } = req.params;

      const configMap = await StructuredStorage.findOne({
        type: StructureType.API_CONFIG_MAPS,
        name: 'api_config_maps'
      });

      if (!configMap) {
        return res.status(404).json({ message: 'No API configuration maps found' });
      }

      const data = configMap.getTypedData<StructureType.API_CONFIG_MAPS>();
      const selectedMap = data[mapName];

      if (!selectedMap) {
        return res.status(404).json({ 
          message: `API configuration map "${mapName}" not found` 
        });
      }

      res.json({
        message: 'API configuration map retrieved successfully',
        mapName,
        configs: selectedMap
      });
    } catch (error) {
      handleErrors(res, error);
    }
  }
);
export default router;
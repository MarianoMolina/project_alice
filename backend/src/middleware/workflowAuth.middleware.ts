import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../interfaces/auth.interface';
import Logger from '../utils/logger';
import { JWT_SECRET, WORKFLOW_SERVICE_KEY } from '../utils/const';

const workflowAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // 1. Verify workflow service authentication
    const serviceKey = req.header('X-Workflow-Service-Key');
    if (serviceKey !== WORKFLOW_SERVICE_KEY) {
      Logger.warn('Invalid workflow service key');
      throw new Error('Invalid service authentication');
    }

    // 2. Get and verify user context
    const userToken = req.header('X-User-Context')?.replace('Bearer ', '');
    if (!userToken) {
      Logger.warn('No user context provided');
      throw new Error('No user context provided');
    }

    try {
      const decoded = jwt.verify(userToken, JWT_SECRET as string) as { userId: string, role: string };
      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };
      req.effectiveUserId = decoded.userId;
      next();
    } catch (jwtError) {
      Logger.error('User context JWT verification failed:', jwtError);
      throw new Error('Invalid user context');
    }
  } catch (error) {
    Logger.error('Workflow authentication failed:', error);
    res.status(401).json({ error: 'Invalid workflow service request' });
  }
};

export default workflowAuth;
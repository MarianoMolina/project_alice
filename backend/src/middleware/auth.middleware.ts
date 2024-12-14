import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../interfaces/auth.interface';
import Logger from '../utils/logger';

const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      Logger.warn('No token provided');
      throw new Error('No token provided');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string, role: string };
      
      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };

      next();
    } catch (jwtError) {
      Logger.error('JWT verification failed:', jwtError, token);
      throw new Error('Invalid token');
    }
  } catch (error) {
    Logger.error('Authentication failed:', error);
    res.status(401).json({ error: 'Please authenticate' });
  }
};

export default auth;
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces/auth.interface';

const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export default adminOnly;
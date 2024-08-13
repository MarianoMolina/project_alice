import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger';

const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  Logger.debug(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  Logger.debug('Headers:', req.headers);
  Logger.debug('Body:', req.body);
  next();
};

export default loggingMiddleware;

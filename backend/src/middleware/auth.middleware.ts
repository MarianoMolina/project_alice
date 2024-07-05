import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../interfaces/auth.interface';

const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.header('Authorization');
 
  if (!authHeader) {
    res.status(401).send({ error: 'No token provided' });
    return;
  }
 
  const token = authHeader.replace('Bearer ', '');
 
  if (!token) {
    res.status(401).send({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; role: string };
    console.log('Decoded token:', decoded); // Debugging line

    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    console.log('User role:', req.user.role); // Debugging line
    next();
  } catch (err) {
    res.status(401).send({ error: 'Invalid token' });
  }
};

export default auth;
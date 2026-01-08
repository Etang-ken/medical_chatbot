import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService.js';
import type { User } from '../types/index.js';

export interface AuthRequest extends Request {
  user?: User;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const user = await verifyToken(token);

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

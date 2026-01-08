import type { Request, Response } from 'express';
import { signup, login } from '../services/authService.js';
import type { AuthRequest } from '../types/index.js';

export async function signupController(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body as AuthRequest;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const result = await signup({ email, password, name });
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signup failed';
    res.status(400).json({ error: message });
  }
}

export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as AuthRequest;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await login({ email, password });
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
}

export async function meController(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user;
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
}

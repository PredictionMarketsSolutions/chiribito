import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import logger from '../config/logger';

// Extend Express Request type to include user information
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        email: string;
      };
    }
  }
}

interface JwtPayload {
  userId: number;
  username: string;
  tokenVersion: number;
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    
    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { id: decoded.userId },
      select: ['id', 'username', 'email', 'tokenVersion']
    });
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if ((user.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
      res.status(401).json({ error: 'Token invalidated' });
      return;
    }

    // Attach user to request object with proper typing
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email
    };

    next();
  } catch (error) {
    logger.error('Authentication error', { error: String(error) });
    
    // Check TokenExpiredError first as it's a subclass of JsonWebTokenError
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    // Handle other types of errors
    if (error instanceof Error) {
      logger.error('Authentication failed', { message: error.message });
    }
    
    res.status(500).json({ error: 'Authentication failed' });
  }
};

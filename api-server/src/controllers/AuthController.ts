import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
  };
  token: string;
}

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);

  private generateAuthToken(user: User): string {
    try {
      // Validate JWT environment variables
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      // Create token with simplified options
      const token = jwt.sign(
        { userId: user.id, username: user.username, tokenVersion: user.tokenVersion ?? 0 },
        jwtSecret,
        { expiresIn: '1h' } // Simplified to fixed expiration for now
      );
      
      return token;
    } catch (error) {
      if (error instanceof Error) {
        console.error('JWT Sign Error:', error.message);
        throw new Error('Failed to generate authentication token');
      }
      throw new Error('An unknown error occurred during token generation');
    }
  }

  async register(
    req: Request<{}, {}, RegisterRequest>,
    res: Response<AuthResponse | { error: string }>
  ): Promise<void> {
    try {
      const { username, email, password } = req.body;

      // Input validation
      if (!username || !email || !password) {
        res.status(400).json({ error: 'Username, email, and password are required' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long' });
        return;
      }
      
      // Check if user exists
      const existingUser = await this.userRepository.findOne({ 
        where: [{ email }, { username }] 
      });
      
      if (existingUser) {
        res.status(400).json({ 
          error: 'User with this email or username already exists' 
        });
        return;
      }

      // Create new user
      const user = new User();
      user.username = username;
      user.email = email;
      user.tokenVersion = 0;
      await user.setPassword(password);

      await this.userRepository.save(user);

      // Generate JWT
      const token = this.generateAuthToken(user);

      res.status(201).json({ 
        user: { id: user.id, username: user.username, email: user.email },
        token 
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Registration error:', error.message);
      } else {
        console.error('An unknown error occurred during registration');
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(
    req: Request<{}, {}, LoginRequest>,
    res: Response<AuthResponse | { error: string }>
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      // Input validation
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Find user
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
      await this.userRepository.save(user);

      // Generate JWT
      const token = this.generateAuthToken(user);

      res.json({ 
        user: { id: user.id, username: user.username, email: user.email },
        token 
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Login error:', error.message);
      } else {
        console.error('An unknown error occurred during login');
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(
    req: Request,
    res: Response<User | { error: string }>
  ): Promise<void> {
    try {
      // User ID is set by the auth middleware
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const user = await this.userRepository.findOne({ 
        where: { id: userId },
        select: ['id', 'username', 'email', 'createdAt'] 
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Profile error:', error.message);
      } else {
        console.error('An unknown error occurred while fetching profile');
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async validateToken(
    req: Request,
    res: Response<{ user: { id: number; username: string; email: string } } | { error: string }>
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        res.status(500).json({ error: 'JWT_SECRET is not defined in environment variables' });
        return;
      }

      const decoded = jwt.verify(token, jwtSecret) as { userId: number; tokenVersion: number };
      const user = await this.userRepository.findOne({ where: { id: decoded.userId } });
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      if ((user.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
        res.status(401).json({ error: 'Token invalidated' });
        return;
      }

      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Validate token error:', error.message);
      } else {
        console.error('An unknown error occurred during token validation');
      }
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
}

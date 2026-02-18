import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from api-server or from repo root
const apiServerEnv = path.resolve(process.cwd(), '.env');
const rootEnv = path.resolve(process.cwd(), '..', '.env');

if (fs.existsSync(apiServerEnv)) {
  dotenv.config({ path: apiServerEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

// Environment variables (defaults)
const env: Record<string, string> = {
  PORT: '3000',
  DB_HOST: 'localhost',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'PokerBase',
  DB_PORT: '5432',
  NODE_ENV: 'development'
};

// Set environment variables only when not already provided
Object.entries(env).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { AuthController } from './controllers/AuthController';
import { UserController } from './controllers/UserController';
import { authenticateJWT } from './middleware/auth';
import { registerValidator, loginValidator } from './middlewares/validators';
import { validateRequest } from './middlewares/validateRequest';
import logger from './config/logger';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// CORS whitelist by environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS?.split(',') || [])
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimit(maxAttempts: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxAttempts) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ 
        error: 'Too many attempts. Please try again later.',
        retryAfter 
      });
    }

    record.count++;
    next();
  };
}

// Cleanup rate limit store every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 600000);

// Initialize controllers
const authController = new AuthController();
const userController = new UserController();

// Auth routes with rate limiting and validation
const authRateLimit = rateLimit(5, 60000); // 5 attempts per minute

app.post('/api/auth/register', authRateLimit, registerValidator, validateRequest, (req: Request, res: Response) => authController.register(req, res));
app.post('/api/auth/login', authRateLimit, loginValidator, validateRequest, (req: Request, res: Response) => authController.login(req, res));
app.post('/api/auth/validate', (req: Request, res: Response) => authController.validateToken(req, res));
app.post('/api/auth/refresh', (req: Request, res: Response) => authController.refreshToken(req, res));
app.post('/api/auth/forgot-password', (req: Request, res: Response) => authController.forgotPassword(req, res));
app.post('/api/auth/reset-password', (req: Request, res: Response) => authController.resetPassword(req, res));

// Protected routes
app.get('/api/users/me', authenticateJWT, async (req, res, next) => {
  try {
    await userController.getProfile(req, res);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/users/me', authenticateJWT, async (req, res, next) => {
  try {
    await userController.deleteUser(req, res);
  } catch (error) {
    next(error);
  }
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, _: any, res: any, __: any) => {
  logger.error('Error handling middleware', { stack: err.stack });
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database connection and start server
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected successfully');
    
    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to connect to the database', { error: String(error) });
    process.exit(1);
  }
};

startServer();

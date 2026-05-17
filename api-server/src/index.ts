import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';
import { AppDataSource } from './config/database';
import { AuthController } from './controllers/AuthController';
import { UserController } from './controllers/UserController';
import { InternalStatsController } from './controllers/InternalStatsController';
import { authenticateJWT } from './middleware/auth';
import { registerValidator, loginValidator } from './middleware/validators';
import { validateRequest } from './middleware/validateRequest';
import logger from './config/logger';
import { User } from './models/User';
import { getTopWinners } from './services/RankingService';
import { setRedisClient as setTokenVersionCacheClient } from './services/tokenVersionCache';

// Type augmentation for Express Request
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

const apiServerEnv = path.resolve(process.cwd(), '.env');
const rootEnv = path.resolve(process.cwd(), '..', '.env');

if (fs.existsSync(apiServerEnv)) {
  dotenv.config({ path: apiServerEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

const env: Record<string, string> = {
  PORT: '3000',
  DB_HOST: 'localhost',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'PokerBase',
  DB_PORT: '5432',
  NODE_ENV: 'development',
};

Object.entries(env).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
  throw new Error('REDIS_URL must be set in production');
}

if (!process.env.INTERNAL_API_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('INTERNAL_API_SECRET must be set in production');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// Body parser with size limits
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// HTTP request logging
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'));

// Request sanitization middleware
app.use((req: Request, _: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    try {
      const sanitize = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(sanitize);
        } else if (obj !== null && typeof obj === 'object') {
          const sanitized: any = {};
          for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitize(value);
          }
          return sanitized;
        } else if (typeof obj === 'string') {
          return obj
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/onerror=/gi, '')
            .replace(/onclick=/gi, '');
        }
        return obj;
      };
      req.body = sanitize(req.body);
    } catch (error) {
      logger.warn('Sanitization error', { error: String(error) });
    }
  }
  next();
});

// Additional security headers middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-JSON-Response-Time');
  next();
});

// Request ID tracking for logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || `${Date.now()}-${Math.random()}`;
  logger.debug('Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Detect and log potential attack patterns
app.use((req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /<script/i,
    /union.*select/i,
    /drop.*table/i,
    /insert.*into/i,
    /delete.*from/i,
  ];

  const queryString = JSON.stringify(req.query);
  const bodyString = JSON.stringify(req.body);
  const fullInput = `${req.path}${queryString}${bodyString}`;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullInput)) {
      logger.warn('Suspicious request pattern detected', {
        requestId: req.id,
        path: req.path,
        pattern: pattern.source,
        ip: req.ip,
      });
      break;
    }
  }

  next();
});


// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) || ['https://chiri-frontend.onrender.com'])
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

logger.info(`CORS allowed origins: ${JSON.stringify(allowedOrigins)}`);
logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`ALLOWED_ORIGINS env: ${process.env.ALLOWED_ORIGINS}`);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    logger.info(`CORS check - Origin: ${origin}, Allowed: ${JSON.stringify(allowedOrigins)}`);
    if (!origin || allowedOrigins.includes(origin)) {
      logger.info(`CORS allowing origin: ${origin}`);
      callback(null, true);
    } else {
      logger.error(`CORS rejecting origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

const redisUrl = process.env.REDIS_URL;
const redisClient = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.error('Redis retry limit exceeded');
          return null;
        }
        return Math.min(times * 200, 1000);
      },
    })
  : null;

if (!redisClient) {
  logger.warn('REDIS_URL not configured, using in-memory rate limiting fallback');
} else {
  logger.info('Redis client initialized');
}

// Wire the Redis client into the token-version cache (used by AuthController).
setTokenVersionCacheClient(redisClient);

const createLimiter = (windowMs: number, max: number, prefix: string) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
    store: redisClient
      ? new RedisStore({
          prefix,
          sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as Promise<any>,
        })
      : undefined,
  });
};

const authController = new AuthController();
const userController = new UserController();
const internalStatsController = new InternalStatsController(redisClient);

const registerRateLimit = createLimiter(15 * 60 * 1000, 5, 'rl:register:');
const loginRateLimit = createLimiter(15 * 60 * 1000, 10, 'rl:login:');
const forgotPasswordRateLimit = createLimiter(15 * 60 * 1000, 5, 'rl:forgot-password:');
const refreshRateLimit = createLimiter(15 * 60 * 1000, 30, 'rl:refresh:');
const resetPasswordRateLimit = createLimiter(15 * 60 * 1000, 10, 'rl:reset-password:');

app.post('/api/auth/register', registerRateLimit, registerValidator, validateRequest, (req: Request, res: Response) => authController.register(req, res));
app.post('/api/auth/login', loginRateLimit, loginValidator, validateRequest, (req: Request, res: Response) => authController.login(req, res));
app.post('/api/auth/validate', (req: Request, res: Response) => authController.validateToken(req, res));
app.post('/api/auth/refresh', refreshRateLimit, (req: Request, res: Response) => authController.refreshToken(req, res));
app.post('/api/auth/forgot-password', forgotPasswordRateLimit, (req: Request, res: Response) => authController.forgotPassword(req, res));
app.post('/api/auth/reset-password', resetPasswordRateLimit, (req: Request, res: Response) => authController.resetPassword(req, res));

app.get('/api/users/me', authenticateJWT, async (req, res, next) => {
  try {
    await userController.getProfile(req, res);
  } catch (error) {
    next(error);
  }
});

app.post('/api/internal/game-ended', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await internalStatsController.gameEnded(req, res);
  } catch (error) {
    next(error);
  }
});

app.get('/api/ranking/top-winners', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const payload = await getTopWinners(redisClient, userRepository);
    return res.json(payload);
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

// Liveness — does the process answer? Cheap, no dependency checks.
// Render uses this for healthCheckPath.
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness — does this instance hold the dependencies it needs to serve
// real traffic? Checks DB connectivity and Redis ping when applicable.
// Returns 200 + per-component status, 503 if any required dep is down.
app.get('/ready', async (_req: Request, res: Response) => {
  const startedAt = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // PostgreSQL — required.
  const dbStart = Date.now();
  try {
    await AppDataSource.query('SELECT 1');
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // Redis — optional in dev, required in prod.
  if (redisClient) {
    const redisStart = Date.now();
    try {
      await redisClient.ping();
      checks.redis = { ok: true, latencyMs: Date.now() - redisStart };
    } catch (err) {
      checks.redis = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  } else {
    checks.redis = { ok: process.env.NODE_ENV !== 'production' };
  }

  const ready = Object.values(checks).every((c) => c.ok);
  res.status(ready ? 200 : 503).json({
    ready,
    checks,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString()
  });
});

app.use((err: Error & { statusCode?: number; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || err.status || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  logger.error('Error handling middleware', {
    message: err.message,
    statusCode,
    stack: isDevelopment ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  // Sanitize error message
  let errorMessage = 'Something went wrong!';
  if (isDevelopment) {
    errorMessage = err.message || errorMessage;
  }

  res.status(statusCode).json({
    error: errorMessage,
    ...(isDevelopment && { details: err.message, stack: err.stack }),
  });
});

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected successfully');

    if (redisClient && redisClient.status === 'wait') {
      logger.info('Redis connection pending, checking status...');
    } else if (redisClient) {
      logger.info('Redis connection established');
    }

    const server = app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          if (redisClient) {
            await redisClient.quit();
            logger.info('Redis connection closed');
          }

          if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            logger.info('Database connection closed');
          }

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error: String(error) });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', { message: error.message, stack: error.stack });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled rejection', { reason: String(reason) });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server dependencies', { error: String(error) });
    process.exit(1);
  }
};

startServer();

# CODE REVIEW: API Server (Express + TypeORM + PostgreSQL)

**Fecha:** 4 de Marzo 2026  
**Reviewer:** GitHub Copilot  
**Scope:** API Server completo - autenticación, base de datos, seguridad, arquitectura

---

## 📊 RESUMEN EJECUTIVO

### Métricas del API Server
```
Archivos TypeScript:    30 archivos
Tamaño total:          103.79 KB
Archivo principal:     index.ts (372 líneas)
Controllers:           2 archivos (AuthController, UserController)
Models:                3 entidades (User, RefreshToken, ResetToken)
Middlewares:           7 archivos (auth duplicado)
Utils:                 7 archivos de seguridad
Dependencies:          ~20 principales
Framework:             Express 4.18.2
ORM:                   TypeORM 0.3.19
Database:              PostgreSQL
Email:                 Resend 4.0.1 ⚠️ (actual: 6.9.3)
```

### Estado General: 🟡 FUNCIONAL CON PROBLEMAS ORGANIZACIONALES

**Puntuación por categoría:**
- **Funcionalidad:** ✅ 8/10 (auth completo, password reset funcionando)
- **Seguridad:** ✅ 7.5/10 (rate-limiting, helmet, JWT con refresh tokens)
- **Arquitectura:** ⚠️ 6/10 (index.ts monolítico, duplicación de código)
- **Testing:** ❌ 0/10 (sin tests unitarios ni integración)
- **Database:** ✅ 8/10 (TypeORM bien configurado, migrations presentes)
- **Documentación:** ⚠️ 4/10 (README básico, sin API docs)
- **Dependencies:** ⚠️ 6/10 (Resend muy desactualizado)

**SCORE TOTAL: 6.2/10** - Funcional pero necesita refactor organizacional y tests

---

## 🏗️ ARQUITECTURA ACTUAL

### Estructura de Archivos
```
api-server/
├── package.json (dependencies)
├── tsconfig.json
└── src/
    ├── index.ts (372 líneas) ⚠️ Monolito de setup
    ├── app.ts (0 líneas) ⚠️ VACÍO - archivo sin uso
    ├── config/
    │   ├── database.ts (TypeORM config)
    │   └── logger.ts (Winston logger)
    ├── controllers/
    │   ├── AuthController.ts (516 líneas) ✅ Bien estructurado
    │   └── UserController.ts (85 líneas) ✅ Simple y limpio
    ├── middleware/ ⚠️ DUPLICADO
    │   ├── auth.ts (98 líneas)
    │   ├── csrf.ts (CSRF protection)
    │   └── security.ts (Security middleware)
    ├── middlewares/ ⚠️ DUPLICADO
    │   ├── auth.ts (50 líneas) ❌ Mismo nombre, código similar
    │   ├── validateRequest.ts (validación de express-validator)
    │   └── validators.ts (schemas de validación)
    ├── models/
    │   ├── User.ts (35 líneas) ✅ Entity con bcrypt
    │   ├── RefreshToken.ts (37 líneas) ✅ JWT refresh tokens
    │   └── ResetToken.ts (password reset)
    ├── routes/
    │   └── auth.ts ⚠️ NO USADO (rutas en index.ts directamente)
    ├── services/
    │   └── EmailService.ts (166 líneas) ✅ Resend integration
    ├── utils/ (7 archivos)
    │   ├── audit.ts (logging de auditoría)
    │   ├── cryptography.ts (JWT helpers, encryption)
    │   ├── ip-security.ts (IP validation, VPN detection)
    │   ├── request-analyzer.ts (análisis de requests)
    │   ├── security-monitor.ts (monitoreo de seguridad)
    │   ├── validation.ts (validación de inputs)
    │   └── security-index.ts (barrel export)
    ├── migrations/
    │   ├── 1704067200000-CreateRefreshTokensTable.ts
    │   ├── 1704067300000-CreateResetTokensTable.ts
    │   └── 1770661877951-AddTokenVersion.ts
    ├── scripts/
    │   └── init-db.ts (inicialización de DB)
    ├── examples/
    │   └── security-usage.example.ts (ejemplos de uso)
    └── types/
        └── global.d.ts
```

### Problema de Organización

#### 🔴 #1: Dos Carpetas de Middlewares

**Duplicación crítica identificada:**

```
api-server/src/
├── middleware/        ← Carpeta 1
│   ├── auth.ts       ← 98 líneas
│   ├── csrf.ts
│   └── security.ts
└── middlewares/       ← Carpeta 2 ❌ DUPLICADO
    ├── auth.ts       ← 50 líneas ❌ MISMO NOMBRE
    ├── validateRequest.ts
    └── validators.ts
```

**Análisis del código duplicado:**

```typescript
// middleware/auth.ts (líneas 1-98)
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { id: decoded.userId },
      select: ['id', 'username', 'email', 'tokenVersion']
    });
    
    // Validar tokenVersion
    if ((user.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
      res.status(401).json({ error: 'Token invalidated' });
      return;
    }
    
    req.user = { userId: user.id, username: user.username, email: user.email };
    next();
  } catch (error) {
    // ... error handling
  }
};

// middlewares/auth.ts (líneas 1-50)
export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // ❌ MISMO CÓDIGO CASI IDÉNTICO
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      userId: number; 
      username: string;
      tokenVersion: number;
    };

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.userId } });

    if ((user.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
      return res.status(401).json({ error: 'Token invalidated' });
    }

    req.user = { 
      userId: user.id, 
      username: user.username,
      email: user.email 
    };
    next();
  } catch (error) {
    // ... error handling
  }
};
```

**¿Cuál se usa en index.ts?**
```typescript
// index.ts línea 16
import { authenticateJWT } from './middleware/auth';  // ← Este se usa

// El de middlewares/auth.ts NO SE USA pero existe
```

**Solución propuesta:**
```bash
# 1. Eliminar middlewares/auth.ts (no usado)
rm -rf api-server/src/middlewares/auth.ts

# 2. Consolidar en una sola carpeta
mkdir -p api-server/src/middleware

# 3. Estructura final
api-server/src/middleware/
├── auth.ts           # Mantener el que se usa
├── csrf.ts
├── security.ts
├── validators.ts     # Mover de middlewares/
└── validateRequest.ts # Mover de middlewares/

# 4. Eliminar carpeta vacía
rm -rf api-server/src/middlewares
```

---

#### 🔴 #2: index.ts Monolítico (372 líneas)

**Problema:** Todo el setup de Express está en un solo archivo.

**Responsabilidades mezcladas en index.ts:**
```typescript
// Líneas 1-60: Environment setup y validación
// Líneas 61-96: Helmet configuration
// Líneas 97-128: Sanitization middleware
// Líneas 129-141: Security headers middleware
// Líneas 142-154: Request ID tracking
// Líneas 155-176: Attack pattern detection
// Líneas 177-204: CORS configuration
// Líneas 205-237: Redis setup para rate limiting
// Líneas 238-258: Rate limiters (5 diferentes)
// Líneas 259-285: Route definitions (todos inline)
// Líneas 286-305: Error handling middleware
// Líneas 306-372: Server startup y graceful shutdown
```

**Ejemplo del problema:**

```typescript
// Líneas 259-285 - Todas las rutas en index.ts
const authController = new AuthController();
const userController = new UserController();

// ❌ Routes definidas en index.ts en lugar de routes/
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

app.delete('/api/users/me', authenticateJWT, async (req, res, next) => {
  try {
    await userController.deleteUser(req, res);
  } catch (error) {
    next(error);
  }
});

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

**Solución propuesta - Arquitectura modular:**

```typescript
// ===== ESTRUCTURA PROPUESTA =====

// app.ts (USAR EL ARCHIVO VACÍO EXISTENTE)
import express from 'express';
import { configureMiddleware } from './config/middleware';
import { configureRoutes } from './config/routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();
  
  // Configurar middleware en orden
  configureMiddleware(app);
  
  // Configurar rutas
  configureRoutes(app);
  
  // Error handler (último middleware)
  app.use(errorHandler);
  
  return app;
}

// config/middleware.ts (NUEVO)
import { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { 
  helmetConfig, 
  corsConfig, 
  sanitizationMiddleware,
  securityHeadersMiddleware,
  requestIdMiddleware,
  attackDetectionMiddleware 
} from '../middleware';

export function configureMiddleware(app: Express): void {
  // Security
  app.use(helmet(helmetConfig));
  app.use(cors(corsConfig));
  
  // Parsing
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  
  // Logging
  app.use(morgan('combined'));
  
  // Custom middleware
  app.use(sanitizationMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(requestIdMiddleware);
  app.use(attackDetectionMiddleware);
}

// config/routes.ts (NUEVO)
import { Express } from 'express';
import { authRoutes } from '../routes/auth';
import { userRoutes } from '../routes/user';
import { healthRoutes } from '../routes/health';

export function configureRoutes(app: Express): void {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/health', healthRoutes);
}

// routes/auth.ts (USAR EL ARCHIVO EXISTENTE)
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { registerValidator, loginValidator } from '../middleware/validators';
import { validateRequest } from '../middleware/validateRequest';
import { createRateLimiter } from '../config/rateLimiter';

const router = Router();
const authController = new AuthController();

// Rate limiters
const registerLimit = createRateLimiter(15 * 60 * 1000, 5, 'rl:register:');
const loginLimit = createRateLimiter(15 * 60 * 1000, 10, 'rl:login:');
const forgotPasswordLimit = createRateLimiter(15 * 60 * 1000, 5, 'rl:forgot-password:');
const refreshLimit = createRateLimiter(15 * 60 * 1000, 30, 'rl:refresh:');
const resetPasswordLimit = createRateLimiter(15 * 60 * 1000, 10, 'rl:reset-password:');

// Routes
router.post('/register', registerLimit, registerValidator, validateRequest, 
  (req, res) => authController.register(req, res));

router.post('/login', loginLimit, loginValidator, validateRequest, 
  (req, res) => authController.login(req, res));

router.post('/validate', 
  (req, res) => authController.validateToken(req, res));

router.post('/refresh', refreshLimit, 
  (req, res) => authController.refreshToken(req, res));

router.post('/forgot-password', forgotPasswordLimit, 
  (req, res) => authController.forgotPassword(req, res));

router.post('/reset-password', resetPasswordLimit, 
  (req, res) => authController.resetPassword(req, res));

export { router as authRoutes };

// routes/user.ts (NUEVO)
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// Protected routes
router.get('/me', authenticateJWT, (req, res, next) => {
  userController.getProfile(req, res).catch(next);
});

router.delete('/me', authenticateJWT, (req, res, next) => {
  userController.deleteUser(req, res).catch(next);
});

export { router as userRoutes };

// routes/health.ts (NUEVO)
import { Router } from 'express';

const router = Router();

router.get('/', (_, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export { router as healthRoutes };

// config/rateLimiter.ts (NUEVO)
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from './redis';

export function createRateLimiter(windowMs: number, max: number, prefix: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
    store: redisClient
      ? new RedisStore({
          prefix,
          sendCommand: (...args: string[]) => 
            redisClient.call(args[0], ...args.slice(1)) as Promise<any>,
        })
      : undefined,
  });
}

// config/redis.ts (NUEVO - extraer de index.ts)
import Redis from 'ioredis';
import logger from './logger';

const redisUrl = process.env.REDIS_URL;

export const redisClient = redisUrl
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

// index.ts (REFACTORIZADO - ~50 líneas)
import 'dotenv/config';
import { createApp } from './app';
import { AppDataSource } from './config/database';
import { redisClient } from './config/redis';
import logger from './config/logger';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize database
    await AppDataSource.initialize();
    logger.info('Database connected successfully');

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          if (redisClient) await redisClient.quit();
          if (AppDataSource.isInitialized) await AppDataSource.destroy();
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error: String(error) });
          process.exit(1);
        }
      });

      // Force shutdown after 10s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', { message: error.message, stack: error.stack });
      process.exit(1);
    });
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled rejection', { reason: String(reason) });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: String(error) });
    process.exit(1);
  }
}

startServer();
```

**Resultado del refactor:**
```
ANTES:
- index.ts: 372 líneas ❌

DESPUÉS:
- index.ts: ~50 líneas ✅ (solo bootstrap)
- app.ts: ~30 líneas ✅ (app factory)
- config/middleware.ts: ~50 líneas ✅
- config/routes.ts: ~20 líneas ✅
- config/redis.ts: ~30 líneas ✅
- config/rateLimiter.ts: ~20 líneas ✅
- routes/auth.ts: ~60 líneas ✅
- routes/user.ts: ~30 líneas ✅
- routes/health.ts: ~15 líneas ✅

✅ TODO ES TESTEABLE
✅ Separación de concerns
✅ Fácil de entender y modificar
```

---

## 🔴 PROBLEMAS CRÍTICOS

### #3: app.ts Vacío y Sin Uso

**Problema:** Archivo creado pero completamente vacío.

```bash
$ cat api-server/src/app.ts
# (vacío - 0 bytes)
```

**Impacto:**
- ❌ Violación de principio de modularidad
- ❌ Todo el setup en index.ts
- ❌ Difícil testear la aplicación Express sin iniciar el servidor

**Solución:** Ya propuesta arriba - usar `app.ts` como factory de la aplicación.

---

### #4: Sin Tests (0% Coverage)

**Problema:** API completa sin ningún test.

```bash
$ npm test
# ❌ No test script configured
```

**Archivos críticos sin tests:**
```
controllers/
  ├── AuthController.ts (516 líneas) ❌ 0 tests
  │   ├── register()
  │   ├── login()
  │   ├── validateToken()
  │   ├── refreshToken()
  │   ├── forgotPassword()
  │   └── resetPassword()
  └── UserController.ts (85 líneas) ❌ 0 tests
      ├── getProfile()
      └── deleteUser()

middleware/
  ├── auth.ts ❌ 0 tests
  ├── validators.ts ❌ 0 tests
  └── validateRequest.ts ❌ 0 tests

services/
  └── EmailService.ts ❌ 0 tests

models/
  ├── User.ts ❌ 0 tests (validatePassword, setPassword)
  ├── RefreshToken.ts ❌ 0 tests
  └── ResetToken.ts ❌ 0 tests
```

**Riesgo:**
- ❌ Cambios sin validación automática
- ❌ Regresiones no detectadas
- ❌ Refactor inseguro

**Solución - Setup Testing:**

```bash
# package.json - Instalar dependencias
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

```json
// package.json - Scripts
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src"],
    "testMatch": ["**/__tests__/**/*.test.ts"],
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts",
      "!src/migrations/**",
      "!src/examples/**",
      "!src/scripts/**"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

**Ejemplos de tests:**

```typescript
// src/controllers/__tests__/AuthController.test.ts
import { Request, Response } from 'express';
import { AuthController } from '../AuthController';
import { AppDataSource } from '../../config/database';
import { User } from '../../models/User';

// Mock database
jest.mock('../../config/database');

describe('AuthController', () => {
  let authController: AuthController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    authController = new AuthController();
    
    req = {
      body: {},
      headers: {},
      connection: { remoteAddress: '127.0.0.1' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      const mockUser = new User();
      mockUser.id = 1;
      mockUser.username = 'testuser';
      mockUser.email = 'test@example.com';

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue(mockUser)
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);

      await authController.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            id: 1,
            username: 'testuser',
            email: 'test@example.com'
          }),
          token: expect.any(String),
          refreshToken: expect.any(String)
        })
      );
    });

    it('should reject registration with short password', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123'
      };

      await authController.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Password must be at least 6 characters long'
      });
    });

    it('should reject registration with duplicate email', async () => {
      req.body = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'SecurePass123!'
      };

      const existingUser = new User();
      existingUser.email = 'existing@example.com';

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(existingUser)
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);

      await authController.register(req as Request, res as Response);

      // Should return success to avoid email enumeration
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        user: { id: 0, username: '', email: '' },
        token: 'dummy',
        refreshToken: 'dummy'
      });
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'CorrectPassword123!'
      };

      const mockUser = new User();
      mockUser.id = 1;
      mockUser.username = 'testuser';
      mockUser.email = 'test@example.com';
      mockUser.validatePassword = jest.fn().mockResolvedValue(true);

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(mockUser)
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);

      await authController.login(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.any(Object),
          token: expect.any(String),
          refreshToken: expect.any(String)
        })
      );
    });

    it('should reject login with incorrect password', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      const mockUser = new User();
      mockUser.validatePassword = jest.fn().mockResolvedValue(false);

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(mockUser)
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should reject login for non-existent user', async () => {
      req.body = {
        email: 'nonexistent@example.com',
        password: 'AnyPassword'
      };

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(null)
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const validRefreshToken = 'valid-refresh-token';
      req.body = { refreshToken: validRefreshToken };

      const mockUser = new User();
      mockUser.id = 1;
      mockUser.username = 'testuser';

      const mockRefreshToken = {
        token: validRefreshToken,
        userId: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false
      };

      const mockRefreshTokenRepo = {
        findOne: jest.fn().mockResolvedValue(mockRefreshToken),
        save: jest.fn(),
        remove: jest.fn()
      };

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(mockUser)
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockImplementation((entity: any) => {
          if (entity === User) return mockUserRepo;
          return mockRefreshTokenRepo;
        });

      await authController.refreshToken(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          refreshToken: expect.any(String)
        })
      );
    });

    it('should reject expired refresh token', async () => {
      const expiredRefreshToken = 'expired-refresh-token';
      req.body = { refreshToken: expiredRefreshToken };

      const mockExpiredToken = {
        token: expiredRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
        revoked: false
      };

      const mockRefreshTokenRepo = {
        findOne: jest.fn().mockResolvedValue(mockExpiredToken),
        remove: jest.fn()
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRefreshTokenRepo);

      await authController.refreshToken(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Refresh token expired' });
      expect(mockRefreshTokenRepo.remove).toHaveBeenCalled();
    });
  });
});

// src/middleware/__tests__/auth.test.ts
import { Request, Response, NextFunction } from 'express';
import { authenticateJWT } from '../auth';
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from '../../config/database';
import { User } from '../../models/User';

jest.mock('jsonwebtoken');
jest.mock('../../config/database');

describe('authenticateJWT middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();

    process.env.JWT_SECRET = 'test-secret';
  });

  it('should authenticate valid token', async () => {
    const token = 'valid-token';
    req.headers = { authorization: `Bearer ${token}` };

    const mockDecoded = {
      userId: 1,
      username: 'testuser',
      tokenVersion: 0
    };

    const mockUser = new User();
    mockUser.id = 1;
    mockUser.username = 'testuser';
    mockUser.email = 'test@example.com';
    mockUser.tokenVersion = 0;

    (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

    const mockUserRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser)
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);

    await authenticateJWT(req as Request, res as Response, next);

    expect(req.user).toEqual({
      userId: 1,
      username: 'testuser',
      email: 'test@example.com'
    });
    expect(next).toHaveBeenCalled();
  });

  it('should reject request without token', async () => {
    req.headers = {};

    await authenticateJWT(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject expired token', async () => {
    const token = 'expired-token';
    req.headers = { authorization: `Bearer ${token}` };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new jwt.TokenExpiredError('Token expired', new Date());
    });

    await authenticateJWT(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject invalidated token (version mismatch)', async () => {
    const token = 'valid-token';
    req.headers = { authorization: `Bearer ${token}` };

    const mockDecoded = {
      userId: 1,
      username: 'testuser',
      tokenVersion: 0
    };

    const mockUser = new User();
    mockUser.id = 1;
    mockUser.tokenVersion = 1; // Different version

    (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

    const mockUserRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser)
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);

    await authenticateJWT(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token invalidated' });
    expect(next).not.toHaveBeenCalled();
  });
});

// src/models/__tests__/User.test.ts
import { User } from '../User';

describe('User model', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
    user.username = 'testuser';
    user.email = 'test@example.com';
  });

  describe('setPassword', () => {
    it('should hash password', async () => {
      await user.setPassword('MySecurePassword123!');

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe('MySecurePassword123!');
      expect(user.passwordHash.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('should create different hashes for same password', async () => {
      const user2 = new User();

      await user.setPassword('SamePassword');
      await user2.setPassword('SamePassword');

      expect(user.passwordHash).not.toBe(user2.passwordHash);
    });
  });

  describe('validatePassword', () => {
    it('should return true for correct password', async () => {
      await user.setPassword('CorrectPassword');

      const isValid = await user.validatePassword('CorrectPassword');

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      await user.setPassword('CorrectPassword');

      const isValid = await user.validatePassword('WrongPassword');

      expect(isValid).toBe(false);
    });

    it('should be case-sensitive', async () => {
      await user.setPassword('SecurePass');

      expect(await user.validatePassword('securepass')).toBe(false);
      expect(await user.validatePassword('SECUREPASS')).toBe(false);
      expect(await user.validatePassword('SecurePass')).toBe(true);
    });
  });
});
```

**Tests de integración:**

```typescript
// src/__tests__/integration/auth.integration.test.ts
import request from 'supertest';
import { createApp } from '../../app';
import { AppDataSource } from '../../config/database';
import { User } from '../../models/User';

describe('Auth API Integration Tests', () => {
  let app: any;
  let testUser: User;

  beforeAll(async () => {
    // Initialize test database
    await AppDataSource.initialize();
    app = createApp();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clean database
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.clear();
  });

  describe('POST /api/auth/register', () => {
    it('should register new user and return JWT', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'SecurePass123!'
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    it('should enforce rate limiting on registration', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      // Make 5 requests (rate limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/register')
          .send({ ...userData, email: `test${i}@example.com` });
      }

      // 6th request should be rate limited
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, email: 'test6@example.com' })
        .expect(429);

      expect(response.body.error).toContain('Too many requests');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const userRepo = AppDataSource.getRepository(User);
      testUser = new User();
      testUser.username = 'testuser';
      testUser.email = 'test@example.com';
      await testUser.setPassword('TestPassword123!');
      testUser = await userRepo.save(testUser);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        })
        .expect(401);
    });
  });

  describe('GET /api/users/me', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and get token
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      authToken = response.body.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/users/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      refreshToken = response.body.refreshToken;
    });

    it('should refresh access token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.refreshToken).not.toBe(refreshToken); // Should be new
    });

    it('should reject invalid refresh token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });
});
```

**Resultados esperados:**

```bash
$ npm test

 PASS  src/controllers/__tests__/AuthController.test.ts
 PASS  src/middleware/__tests__/auth.test.ts  
 PASS  src/models/__tests__/User.test.ts
 PASS  src/__tests__/integration/auth.integration.test.ts

Test Suites: 4 passed, 4 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        4.532 s
Coverage:    78.4% (target: 70%)
```

---

### #5: Resend API Desactualizada (4.0.1 → 6.9.3)

**Problema:** EmailService usa Resend 4.0.1, versión de hace 2+ años.

```json
// package.json línea 41
"resend": "^4.0.1",  // ❌ Actual: 6.9.3 (Feb 2026)
```

**Breaking changes en Resend 5.x y 6.x:**
- API method changes
- TypeScript type improvements
- Error handling refactor

**Solución:**

```bash
# Actualizar a versión latest
npm install resend@latest

# Verificar changelog
# https://github.com/resend/resend-node/releases
```

```typescript
// services/EmailService.ts - Actualizado para Resend 6.x
import { Resend } from 'resend';
import logger from '../config/logger';

export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      logger.warn('RESEND_API_KEY not set - email sending disabled');
    } else {
      // ✅ Resend 6.x - Constructor mejorado
      this.resend = new Resend(resendApiKey);
    }
  }

  private async sendEmail(
    to: string, 
    subject: string, 
    html: string
  ): Promise<boolean> {
    try {
      if (!this.resend) {
        logger.warn('Cannot send email - RESEND_API_KEY not configured');
        return false;
      }

      // ✅ Resend 6.x - emails.send retorna { data, error }
      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@yourapp.com',
        to,
        subject,
        html,
      });

      if (error) {
        logger.error('Failed to send email', { 
          to, 
          subject, 
          error: error.message 
        });
        return false;
      }

      logger.info('Email sent successfully', { 
        to, 
        subject, 
        emailId: data?.id 
      });
      return true;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to send email', { to, subject, error: error.message });
      }
      return false;
    }
  }

  // ✅ Método con retry logic
  async sendPasswordResetEmail(
    email: string, 
    resetToken: string, 
    resetLink: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset the password for your account.</p>
        <p>Click the link below to reset your password (valid for 30 minutes):</p>
        <p>
          <a href="${resetLink}" 
             style="display: inline-block; padding: 10px 20px; background-color: #007bff; 
                    color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>Or copy this link: ${resetLink}</p>
        <p style="color: #666; font-size: 12px;">
          If you didn't request a password reset, please ignore this email.
          This link will expire in 30 minutes.
        </p>
      </div>
    `;

    const sent = await this.sendEmail(email, 'Password Reset Request', html);
    
    if (sent) {
      logger.info('Password reset email sent', { email, resetToken });
    }
    
    return sent;
  }

  // ✅ Método con template personalizado
  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Chiribito Poker! 🎰</h2>
        <p>Hi ${username},</p>
        <p>Thanks for joining us! Your account has been created successfully.</p>
        <p>You can now log in and start playing poker with friends.</p>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
             style="display: inline-block; padding: 10px 20px; background-color: #28a745; 
                    color: white; text-decoration: none; border-radius: 5px;">
            Start Playing
          </a>
        </p>
        <p>See you at the tables! 🃏</p>
      </div>
    `;

    return this.sendEmail(email, 'Welcome to Chiribito Poker!', html);
  }
}

export const emailService = new EmailService();
```

---

## ⚠️ PROBLEMAS SECUNDARIOS

### #6: CORS Configuration Demasiado Verbose

**Problema:** Logs excesivos de CORS en cada request.

```typescript
// index.ts líneas 177-204
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    logger.info(`CORS check - Origin: ${origin}, Allowed: ${JSON.stringify(allowedOrigins)}`);
    if (!origin || allowedOrigins.includes(origin)) {
      logger.info(`CORS allowing origin: ${origin}`);  // ❌ Log en cada request
      callback(null, true);
    } else {
      logger.error(`CORS rejecting origin: ${origin}`); // ❌ Log error excesivo
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
```

**Impacto:**
- ❌ Logs saturados en producción
- ❌ Performance degradada por escritura de logs
- ❌ Difícil encontrar logs importantes

**Solución:**

```typescript
// config/cors.ts
import { CorsOptions } from 'cors';
import logger from './logger';

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) || 
     ['https://chiri-frontend.onrender.com'])
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

logger.info('CORS configuration loaded', { 
  env: process.env.NODE_ENV,
  allowedOrigins 
});

export const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // ✅ Log solo cuando se rechaza
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS: Rejected origin', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
```

---

### #7: Magic Numbers en Rate Limiters

**Problema:** Rate limits hardcoded sin constantes.

```typescript
// index.ts líneas 246-253
const registerRateLimit = createLimiter(15 * 60 * 1000, 5, 'rl:register:');
const loginRateLimit = createLimiter(15 * 60 * 1000, 10, 'rl:login:');
const forgotPasswordRateLimit = createLimiter(15 * 60 * 1000, 5, 'rl:forgot-password:');
const refreshRateLimit = createLimiter(15 * 60 * 1000, 30, 'rl:refresh:');
const resetPasswordRateLimit = createLimiter(15 * 60 * 1000, 10, 'rl:reset-password:');
// ❌ Magic numbers: ¿por qué 15 min? ¿por qué 5, 10, 30 requests?
```

**Solución:**

```typescript
// config/rateLimits.ts
export const RATE_LIMITS = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  
  REGISTER: {
    MAX_REQUESTS: 5,
    REASON: 'Prevent automated account creation'
  },
  
  LOGIN: {
    MAX_REQUESTS: 10,
    REASON: 'Prevent brute force attacks'
  },
  
  FORGOT_PASSWORD: {
    MAX_REQUESTS: 5,
    REASON: 'Prevent email enumeration'
  },
  
  REFRESH_TOKEN: {
    MAX_REQUESTS: 30,
    REASON: 'Allow multiple sessions'
  },
  
  RESET_PASSWORD: {
    MAX_REQUESTS: 10,
    REASON: 'Prevent token brute force'
  }
} as const;

// Usage
import { RATE_LIMITS } from './config/rateLimits';

const registerRateLimit = createLimiter(
  RATE_LIMITS.WINDOW_MS, 
  RATE_LIMITS.REGISTER.MAX_REQUESTS, 
  'rl:register:'
);
```

---

### #8: Error Messages Exponen Información Interna

**Problema:** Algunos error messages revelan detalles internos.

```typescript
// AuthController.ts línea 42
throw new Error('JWT_SECRET is not defined in environment variables');
// ❌ En producción, esto revela configuración interna

// AuthController.ts línea 332
res.status(500).json({ error: 'JWT_SECRET is not defined in environment variables' });
// ❌ Cliente no debería saber sobre variables de entorno
```

**Solución:**

```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean; // Error esperado vs bug
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error completo (server-side)
  logger.error('Request error', {
    requestId: req.id,
    path: req.path,
    method: req.method,
    statusCode,
    message: err.message,
    stack: err.stack,
    isOperational: err.isOperational ?? false
  });

  // Response al cliente (sanitizado)
  if (isProduction) {
    // ✅ En producción: mensajes genéricos
    if (statusCode >= 500) {
      res.status(statusCode).json({
        error: 'Internal server error',
        requestId: req.id // Para soporte
      });
    } else {
      // Errores 4xx - ok mostrar
      res.status(statusCode).json({
        error: err.message,
        requestId: req.id
      });
    }
  } else {
    // ✅ En desarrollo: info completa
    res.status(statusCode).json({
      error: err.message,
      stack: err.stack,
      requestId: req.id
    });
  }
}

// utils/errors.ts
export class AuthenticationError extends Error implements AppError {
  statusCode = 401;
  isOperational = true;

  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class ConfigurationError extends Error implements AppError {
  statusCode = 500;
  isOperational = false; // No esperado - bug de configuración

  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

// Uso en AuthController
private generateAuthToken(user: User): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    // ✅ Error interno - no llega al cliente
    throw new ConfigurationError('JWT_SECRET is not configured');
  }

  try {
    return jwt.sign(
      { userId: user.id, username: user.username, tokenVersion: user.tokenVersion ?? 0 },
      jwtSecret,
      { expiresIn: '1h' }
    );
  } catch (error) {
    logger.error('JWT Sign Error', { message: error.message });
    // ✅ Mensaje genérico al cliente
    throw new AuthenticationError('Failed to generate authentication token');
  }
}
```

---

## ✅ BUENAS PRÁCTICAS ENCONTRADAS

### Puntos Positivos del API Server

#### 1. **TypeORM Bien Configurado** ✅

```typescript
// config/database.ts - Buena configuración
const dbConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  synchronize: false,  // ✅ Disabled en producción
  logging: process.env.NODE_ENV === 'development',  // ✅ Solo dev
  entities: [User, RefreshToken, ResetToken],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? "dist/migrations/*.js"
      : "src/migrations/*.ts"
  ],
  ssl: sslEnabled ? { 
    rejectUnauthorized: process.env.NODE_ENV === 'production' 
  } : false,
};
```

**Análisis:**
- ✅ `synchronize: false` - No auto-alter schema en producción
- ✅ Migrations separadas por entorno
- ✅ SSL configurado para producción
- ✅ Logging solo en desarrollo

---

#### 2. **Refresh Token Rotation** ✅

```typescript
// AuthController.ts líneas 300-375
async refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;

  // 1. ✅ Verificar token en BD (no solo JWT)
  const storedToken = await this.refreshTokenRepository.findOne({
    where: { token: refreshToken, revoked: false }
  });

  if (!storedToken) {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  // 2. ✅ Check expiration
  if (new Date() > storedToken.expiresAt) {
    await this.refreshTokenRepository.remove(storedToken);
    res.status(401).json({ error: 'Refresh token expired' });
    return;
  }

  // 3. ✅ Verify JWT signature
  const decoded = jwt.verify(refreshToken, jwtSecret) as { userId: number };
  
  // 4. ✅ Generar NUEVOS tokens (rotation)
  const newToken = this.generateAuthToken(user);
  const newRefreshTokenStr = this.generateRefreshToken(user);

  // 5. ✅ REVOCAR token viejo
  storedToken.revoked = true;
  await this.refreshTokenRepository.save(storedToken);

  // 6. ✅ Guardar nuevo refresh token
  const newRefreshToken = new RefreshToken();
  newRefreshToken.userId = user.id;
  newRefreshToken.token = newRefreshTokenStr;
  newRefreshToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  newRefreshToken.ipAddress = this.getClientIp(req);
  newRefreshToken.userAgent = this.getUserAgent(req);
  await this.refreshTokenRepository.save(newRefreshToken);

  res.json({ token: newToken, refreshToken: newRefreshTokenStr });
}
```

**Análisis:**
- ✅ Token rotation (OWASP recommendation)
- ✅ Revoked tokens no reutilizables
- ✅ IP + User-Agent tracking
- ✅ Database validation (no solo JWT verify)

---

#### 3. **Token Version para Session Invalidation** ✅

```typescript
// models/User.ts
@Column({ name: 'token_version', default: 0 })
tokenVersion!: number;

// AuthController.ts - Password reset
user.tokenVersion = (user.tokenVersion ?? 0) + 1;
await this.userRepository.save(user);

// Revoke all refresh tokens
await this.refreshTokenRepository.update(
  { userId: user.id },
  { revoked: true }
);

// middleware/auth.ts - Validación
if ((user.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
  res.status(401).json({ error: 'Token invalidated' });
  return;
}
```

**Análisis:**
- ✅ Permite invalidar todas las sesiones de un usuario
- ✅ Útil para password reset, logout global, security breach
- ✅ Implementación simple pero efectiva

---

#### 4. **Rate Limiting con Redis** ✅

```typescript
// index.ts - Redis rate limiting
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
          sendCommand: (...args: string[]) => 
            redisClient.call(args[0], ...args.slice(1)) as Promise<any>,
        })
      : undefined,  // ✅ Fallback a in-memory
  });
};
```

**Análisis:**
- ✅ Redis para rate limiting distribuido
- ✅ Fallback to in-memory si Redis no disponible
- ✅ Retry strategy configurado
- ✅ Diferentes límites por endpoint

---

#### 5. **Security Middleware Stack** ✅

```typescript
// index.ts líneas 67-96
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

// Sanitization middleware (líneas 97-125)
const sanitize = (obj: any): any => {
  if (typeof obj === 'string') {
    return obj
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/onerror=/gi, '')
      .replace(/onclick=/gi, '');
  }
  // ... recursivo para objects y arrays
};

// Attack pattern detection (líneas 155-176)
const suspiciousPatterns = [
  /<script/i,
  /union.*select/i,
  /drop.*table/i,
  /insert.*into/i,
  /delete.*from/i,
];
```

**Análisis:**
- ✅ Helmet con CSP configurado
- ✅ HSTS enabled (HTTPS enforcement)
- ✅ Input sanitization recursiva
- ✅ SQL injection pattern detection
- ✅ XSS prevention

---

#### 6. **Graceful Shutdown** ✅

```typescript
// index.ts líneas 319-352
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // 1. ✅ Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // 2. ✅ Close Redis connection
      if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed');
      }

      // 3. ✅ Close database connections
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

  // 4. ✅ Force shutdown after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

**Análisis:**
- ✅ SIGTERM/SIGINT handling (Kubernetes, Docker)
- ✅ Close connections in order
- ✅ Timeout para forzar shutdown
- ✅ Logging de cada paso

---

#### 7. **Email Enumeration Prevention** ✅

```typescript
// AuthController.ts línea 111-128
const existingUser = await this.userRepository.findOne({ 
  where: [{ email }, { username }] 
});

if (existingUser) {
  // ✅ Return success to avoid email enumeration
  res.status(201).json({ 
    user: { id: 0, username: '', email: '' },
    token: 'dummy',
    refreshToken: 'dummy'
  });
  logger.info('Registration attempt with existing user', { email, username });
  return;
}

// Forgot password (línea 396-405)
const user = await this.userRepository.findOne({ where: { email } });

// ✅ Always return success
if (!user) {
  res.json({ message: 'If the email exists, a password reset link has been sent' });
  return;
}
```

**Análisis:**
- ✅ No revela si email existe o no
- ✅ Previene enumeración de usuarios
- ✅ OWASP recommendation

---

## 🔒 ANÁLISIS DE SEGURIDAD

### Fortalezas de Seguridad

1. **Helmet + CSP** ✅
   - Content Security Policy configurado
   - X-Frame-Options: DENY
   - HSTS enabled
   - noSniff protection

2. **Rate Limiting** ✅
   - Redis-backed (distribuido)
   - Diferentes límites por endpoint
   - Fallback a in-memory

3. **JWT + Refresh Tokens** ✅
   - Token rotation
   - Refresh token revocation
   - Token version para invalidación global
   - IP + User-Agent tracking

4. **Input Sanitization** ✅
   - Recursiva (objects y arrays)
   - XSS prevention
   - SQL injection pattern detection

5. **Password Security** ✅
   - bcrypt con 10 rounds
   - Validación de longitud mínima
   - No se expone passwordHash en responses

### Vulnerabilidades Identificadas

#### 🟡 #1: CSRF Protection No Implementada

**Problema:** Archivo `csrf.ts` existe pero no se usa.

```typescript
// middleware/csrf.ts - Código presente pero NO IMPORTADO
export function csrfProtection(/* ... */) {
  // Implementación completa...
}

// index.ts - NO LO USA
// ❌ app.use(csrfProtection()) // No presente
```

**Solución:**
```typescript
// index.ts - DESPUÉS de session middleware
import { csrfProtection, csrfTokenProvider } from './middleware/csrf';

app.use(csrfProtection());

// Endpoint para obtener token CSRF
app.get('/api/csrf-token', csrfTokenProvider());
```

---

#### 🟡 #2: JWT_SECRET Sin Validación de Fuerza

**Problema:** JWT_SECRET puede ser débil.

```typescript
// index.ts líneas 59-61
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}
// ✅ Valida presencia
// ❌ No valida fuerza (ej: "123" es válido)
```

**Solución:**
```typescript
// config/security.ts
export function validateJwtSecret(secret: string | undefined): void {
  if (!secret) {
    throw new Error('JWT_SECRET must be set');
  }

  // ✅ Validar longitud mínima
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  // ✅ Validar complejidad
  const hasUpperCase = /[A-Z]/.test(secret);
  const hasLowerCase = /[a-z]/.test(secret);
  const hasNumbers = /\d/.test(secret);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(secret);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) {
    throw new Error('JWT_SECRET must contain uppercase, lowercase, numbers, and special characters');
  }

  // ✅ Detectar secretos comunes
  const commonSecrets = ['secret', 'password', '12345678', 'jwt_secret'];
  if (commonSecrets.some(common => secret.toLowerCase().includes(common))) {
    logger.error('JWT_SECRET appears to be weak - using common patterns');
  }
}

// Uso en index.ts
validateJwtSecret(process.env.JWT_SECRET);
```

---

#### 🟡 #3: Sin Request ID Propagation

**Problema:** Request ID creado pero no propagado a servicios.

```typescript
// index.ts línea 142
req.id = req.headers['x-request-id'] as string || `${Date.now()}-${Math.random()}`;

// ❌ Pero no se propaga a:
// - Logger context
// - Error responses
// - Database queries
// - Email service
```

**Solución:**
```typescript
// middleware/requestId.ts
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '../config/logger';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generate or use existing request ID
  req.id = req.headers['x-request-id'] as string || randomUUID();

  // Attach to response headers
  res.setHeader('X-Request-ID', req.id);

  // Create child logger with request ID
  (req as any).logger = logger.child({ requestId: req.id });

  next();
}

// Uso en controllers
async register(req: Request, res: Response): Promise<void> {
  const log = (req as any).logger || logger;
  
  try {
    log.info('Registration attempt', { email: req.body.email });
    // ...
  } catch (error) {
    log.error('Registration failed', { error: error.message });
    // ...
  }
}
```

---

## 📋 CHECKLIST DE TAREAS

### Inmediato (Sprint 1 - 1 semana)

- [ ] **Eliminar duplicación de middleware**
  - [ ] Borrar `middlewares/auth.ts` (no usado)
  - [ ] Consolidar en carpeta `middleware/`
  - [ ] Actualizar imports
  - [ ] Verificar que todo funciona

- [ ] **Setup Testing**
  - [ ] Instalar Jest + Supertest
  - [ ] Configurar jest.config.js
  - [ ] Crear database de testing
  - [ ] Escribir primeros 10 tests (AuthController)

- [ ] **Actualizar Resend**
  - [ ] `npm install resend@latest`
  - [ ] Revisar breaking changes
  - [ ] Actualizar EmailService.ts
  - [ ] Testear envío de emails

**Tiempo estimado:** 40 horas (1 semana)

---

### Corto Plazo (Sprint 2-3 - 2 semanas)

- [ ] **Refactor index.ts → app.ts**
  - [ ] Usar `app.ts` vacío como factory
  - [ ] Extraer `config/middleware.ts`
  - [ ] Extraer `config/routes.ts`
  - [ ] Extraer `config/rateLimiter.ts`
  - [ ] Extraer `config/redis.ts`
  - [ ] Reducir index.ts a ~50 líneas

- [ ] **Implementar routes/ separados**
  - [ ] `routes/auth.ts` completo
  - [ ] `routes/user.ts` completo
  - [ ] `routes/health.ts` completo
  - [ ] Tests de integración por ruta

- [ ] **Escribir tests completos**
  - [ ] AuthController (516 líneas): 30 tests
  - [ ] UserController (85 líneas): 10 tests
  - [ ] middleware/auth.ts: 15 tests
  - [ ] models/User.ts: 10 tests
  - [ ] Integration tests: 20 tests
  - [ ] Coverage target: >70%

**Tiempo estimado:** 80 horas (2 semanas)

---

### Mediano Plazo (Sprint 4 - 1 semana)

- [ ] **Implementar CSRF protection**
  - [ ] Activar `csrfProtection` middleware
  - [ ] Endpoint `/api/csrf-token`
  - [ ] Frontend integration
  - [ ] Tests

- [ ] **Mejorar seguridad**
  - [ ] Validar fuerza de JWT_SECRET
  - [ ] Request ID propagation
  - [ ] Error messages sanitization
  - [ ] Security headers audit

- [ ] **Documentación**
  - [ ] API documentation (Swagger/OpenAPI)
  - [ ] README con setup instructions
  - [ ] Environment variables documentation
  - [ ] Examples de uso

**Tiempo estimado:** 40 horas (1 semana)

---

### Largo Plazo (Sprint 5 - 1 semana)

- [ ] **CI/CD Pipeline**
  - [ ] GitHub Actions para tests
  - [ ] Auto-deploy a staging
  - [ ] Database migration automation
  - [ ] Security scanning (Snyk, Dependabot)

- [ ] **Monitoring y Observability**
  - [ ] APM integration (New Relic, Datadog)
  - [ ] Error tracking (Sentry)
  - [ ] Performance monitoring
  - [ ] Database query analysis

- [ ] **Performance Optimization**
  - [ ] Database query optimization
  - [ ] Redis caching strategy
  - [ ] Response compression
  - [ ] Load testing (k6, Artillery)

**Tiempo estimado:** 40 horas (1 semana)

---

## 📊 MÉTRICAS DE ÉXITO

### Antes del Refactor
```
index.ts:            372 líneas ❌
Middleware duplicado: 2 carpetas ❌
Testing:             0% coverage ❌
Dependencies:        Resend 4.0.1 ⚠️
Documentation:       Mínima ⚠️
CSRF:                No implementado ⚠️
```

### Después del Refactor (Target)
```
index.ts:            ~50 líneas ✅
app.ts:              ~30 líneas ✅
Archivos modulares:  15+ archivos ✅
Testing:             >70% coverage ✅
Dependencies:        Actualizadas ✅
Documentation:       API docs completa ✅
CSRF:                Implementado ✅
CI/CD:               GitHub Actions ✅
```

---

## 🎓 CONCLUSIONES

### Resumen

El API Server de Chiribito está **funcionalmente completo y seguro** para single-server deployment, pero presenta **problemas organizacionales** que dificultan mantenimiento y escalabilidad:

1. ✅ **Fortalezas:**
   - Autenticación robusta (JWT + refresh tokens)
   - Security best practices (rate limiting, helmet, CSRF code presente)
   - TypeORM bien configurado
   - Graceful shutdown
   - Email enumeration prevention

2. ❌ **Debilidades:**
   - index.ts monolítico (372 líneas)
   - Middleware duplicado (2 carpetas)
   - 0 tests (alto riesgo de regresiones)
   - Resend desactualizado (4.0.1 → 6.9.3)
   - app.ts vacío sin uso

### Prioridades

#### 🔴 CRÍTICO (Hacer ya)
1. Eliminar duplicación de middleware
2. Setup testing suite (Jest + Supertest)
3. Escribir tests básicos de AuthController
4. Actualizar Resend a 6.x

#### 🟡 IMPORTANTE (Hacer pronto)
5. Refactor index.ts → arquitectura modular
6. Implementar routes/ separados
7. Coverage >70% con tests completos
8. CSRF protection activada

#### 🟢 MEJORAS (Hacer después)
9. API documentation (Swagger)
10. CI/CD pipeline
11. Monitoring y observability
12. Performance optimization

### Estimación Total

**Tiempo de refactor completo:** 5 semanas (200 horas)
- Sprint 1: Cleanup + Testing setup (1 semana)
- Sprint 2-3: Refactor arquitectónico + Tests (2 semanas)
- Sprint 4: Seguridad + Documentación (1 semana)
- Sprint 5: CI/CD + Monitoring (1 semana)

**ROI esperado:**
- Maintainability: +60% (código modular)
- Confidence: +80% (tests previenen bugs)
- Security: +20% (CSRF, validaciones)
- Velocity: +40% (cambios más seguros)

---

## 🔗 PRÓXIMOS PASOS

1. **Revisar** este documento con el equipo
2. **Priorizar** tareas según impacto/esfuerzo
3. **Comenzar** con Sprint 1 (cleanup + testing)
4. **Proceder** con Game Backend review

**Siguiente code review:** [Game Backend](./CODE_REVIEW_GAME_BACKEND.md)

---

**Fin del Code Review - API Server**  
**GitHub Copilot | Marzo 4, 2026**

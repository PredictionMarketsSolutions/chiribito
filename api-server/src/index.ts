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
  JWT_SECRET: 'testPoker',
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
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { AuthController } from './controllers/AuthController';
import { UserController } from './controllers/UserController';
import { authenticateJWT } from './middleware/auth';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize controllers
const authController = new AuthController();
const userController = new UserController();

// Auth routes
app.post('/api/auth/register', (req, res) => authController.register(req, res));
app.post('/api/auth/login', (req, res) => authController.login(req, res));
app.post('/api/auth/validate', (req, res) => authController.validateToken(req, res));

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
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database connection and start server
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database', error);
    process.exit(1);
  }
};

startServer();

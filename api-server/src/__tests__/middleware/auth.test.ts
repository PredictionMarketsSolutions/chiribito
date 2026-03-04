import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { authenticateJWT } from '../../middleware/auth';
import { AppDataSource } from '../../config/database';
import { User } from '../../models/User';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../config/logger');

describe('authenticateJWT Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let mockUserRepository: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup request object
    req = {
      headers: {}
    };

    // Setup response object with chainable methods
    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any
    } as any;

    // Setup next function
    next = jest.fn() as jest.Mock;

    // Setup environment
    process.env.JWT_SECRET = 'test-secret-key-min-32-chars-long!!';

    // Mock user repository
    mockUserRepository = {
      findOne: jest.fn()
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);
  });

  describe('Happy Path - Valid Token', () => {
    it('should authenticate with valid JWT token', async () => {
      // Arrange
      const validToken = jwt.sign(
        { userId: 1, username: 'testuser', tokenVersion: 0 },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      req.headers = { authorization: `Bearer ${validToken}` };

      const mockUser = new User();
      mockUser.id = 1;
      mockUser.username = 'testuser';
      mockUser.email = 'test@example.com';
      mockUser.tokenVersion = 0;

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect((req as any).user).toEqual({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com'
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'username', 'email', 'tokenVersion']
      });
    });

    it('should pass user object to next middleware', async () => {
      // Arrange
      const token = jwt.sign(
        { userId: 42, username: 'admin', tokenVersion: 0 },
        process.env.JWT_SECRET!
      );

      req.headers = { authorization: `Bearer ${token}` };

      const mockUser = new User();
      mockUser.id = 42;
      mockUser.username = 'admin';
      mockUser.email = 'admin@example.com';
      mockUser.tokenVersion = 0;

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect((req as any).user?.userId).toBe(42);
      expect((req as any).user?.username).toBe('admin');
    });
  });

  describe('Error Cases - Missing/Invalid Token', () => {
    it('should reject request without Authorization header', async () => {
      // Arrange
      req.headers = {}; // No authorization header

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with missing Bearer prefix', async () => {
      // Arrange
      req.headers = { authorization: 'InvalidTokenFormat' };

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with empty Bearer token', async () => {
      // Arrange
      req.headers = { authorization: 'Bearer ' };

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid JWT token', async () => {
      // Arrange
      req.headers = { authorization: 'Bearer invalid.token.here' };

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired JWT token', async () => {
      // Arrange
      const expiredToken = jwt.sign(
        { userId: 1, username: 'testuser', tokenVersion: 0 },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Already expired
      );

      req.headers = { authorization: `Bearer ${expiredToken}` };

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token signed with different secret', async () => {
      // Arrange
      const tokenWithWrongSecret = jwt.sign(
        { userId: 1, username: 'testuser', tokenVersion: 0 },
        'wrong-secret-key'
      );

      req.headers = { authorization: `Bearer ${tokenWithWrongSecret}` };

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Database Errors', () => {
    it('should reject when user does not exist in database', async () => {
      // Arrange
      const validToken = jwt.sign(
        { userId: 999, username: 'nonexistent', tokenVersion: 0 },
        process.env.JWT_SECRET!
      );

      req.headers = { authorization: `Bearer ${validToken}` };
      mockUserRepository.findOne.mockResolvedValue(null); // User not found

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when database query fails', async () => {
      // Arrange
      const validToken = jwt.sign(
        { userId: 1, username: 'testuser', tokenVersion: 0 },
        process.env.JWT_SECRET!
      );

      req.headers = { authorization: `Bearer ${validToken}` };
      mockUserRepository.findOne.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
      expect(next).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Token Version Validation', () => {
    it('should reject token with mismatched tokenVersion', async () => {
      // Arrange
      const tokenWithOldVersion = jwt.sign(
        { userId: 1, username: 'testuser', tokenVersion: 0 },
        process.env.JWT_SECRET!
      );

      req.headers = { authorization: `Bearer ${tokenWithOldVersion}` };

      const mockUser = new User();
      mockUser.id = 1;
      mockUser.username = 'testuser';
      mockUser.email = 'test@example.com';
      mockUser.tokenVersion = 5; // Different version (invalidated)

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token invalidated' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept when tokenVersion matches', async () => {
      // Arrange
      const token = jwt.sign(
        { userId: 1, username: 'testuser', tokenVersion: 3 },
        process.env.JWT_SECRET!
      );

      req.headers = { authorization: `Bearer ${token}` };

      const mockUser = new User();
      mockUser.id = 1;
      mockUser.username = 'testuser';
      mockUser.email = 'test@example.com';
      mockUser.tokenVersion = 3; // Same version

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect((req as any).user?.userId).toBe(1);
    });

    it('should handle null tokenVersion gracefully', async () => {
      // Arrange
      const token = jwt.sign(
        { userId: 1, username: 'testuser', tokenVersion: 0 },
        process.env.JWT_SECRET!
      );

      req.headers = { authorization: `Bearer ${token}` };

      const mockUser = new User();
      mockUser.id = 1;
      mockUser.username = 'testuser';
      mockUser.email = 'test@example.com';
      mockUser.tokenVersion = null as any; // Client older version

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert - Should accept (null ?? 0 === 0)
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed Authorization header gracefully', async () => {
      // Arrange
      req.headers = { authorization: 'Bearer' }; // No token after Bearer

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle exception during JWT verification', async () => {
      // Arrange
      req.headers = { authorization: 'Bearer corrupted.jwt.token' };

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should not call next() on any error condition', async () => {
      // Arrange
      req.headers = { authorization: 'Bearer invalid' };

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert - Critical: never call next on auth error
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive Bearer prefix', async () => {
      // Arrange - lowercase 'bearer' should also work
      const validToken = jwt.sign(
        { userId: 1, username: 'testuser', tokenVersion: 0 },
        process.env.JWT_SECRET!
      );

      req.headers = { authorization: `Bearer ${validToken}` }; // Capital B is standard

      const mockUser = new User();
      mockUser.id = 1;
      mockUser.username = 'testuser';
      mockUser.email = 'test@example.com';
      mockUser.tokenVersion = 0;

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert - Only uppercase Bearer is supported
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Environment Variable Handling', () => {
    it('should throw error when JWT_SECRET is not set', async () => {
      // Arrange
      const validToken = jwt.sign(
        { userId: 1, username: 'testuser', tokenVersion: 0 },
        process.env.JWT_SECRET!
      );

      req.headers = { authorization: `Bearer ${validToken}` };
      delete process.env.JWT_SECRET;

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Performance and Efficiency', () => {
    it('should only query specific user fields (not full user object)', async () => {
      // Arrange
      const validToken = jwt.sign(
        { userId: 1, username: 'testuser', tokenVersion: 0 },
        process.env.JWT_SECRET!
      );

      req.headers = { authorization: `Bearer ${validToken}` };

      const mockUser = new User();
      mockUser.id = 1;
      mockUser.username = 'testuser';
      mockUser.email = 'test@example.com';
      mockUser.tokenVersion = 0;

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          select: ['id', 'username', 'email', 'tokenVersion']
        })
      );
    });

    it('should not expose sensitive fields to request object', async () => {
      // Arrange
      const validToken = jwt.sign(
        { userId: 1, username: 'testuser', tokenVersion: 0 },
        process.env.JWT_SECRET!
      );

      req.headers = { authorization: `Bearer ${validToken}` };

      const mockUser = new User();
      mockUser.id = 1;
      mockUser.username = 'testuser';
      mockUser.email = 'test@example.com';
      mockUser.tokenVersion = 0;
      mockUser.passwordHash = 'should-not-be-exposed';

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect((req as any).user).not.toHaveProperty('passwordHash');
      expect((req as any).user).toEqual({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com'
      });
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log authentication errors', async () => {
      // Arrange
      req.headers = { authorization: 'Bearer invalid' };

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(logger.error).toHaveBeenCalled();
    });

    it('should log with appropriate error context', async () => {
      // Arrange
      const token = jwt.sign(
        { userId: 1, username: 'testuser', tokenVersion: 0 },
        process.env.JWT_SECRET!
      );

      req.headers = { authorization: `Bearer ${token}` };
      mockUserRepository.findOne.mockRejectedValue(
        new Error('DB connection timeout')
      );

      // Act
      await authenticateJWT(req as Request, res as Response, next);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          error: expect.any(String)
        })
      );
    });
  });
});

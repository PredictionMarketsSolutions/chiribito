import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { ResetToken } from '../models/ResetToken';
import { emailService } from '../services/EmailService';
import logger from '../config/logger';

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
  refreshToken: string;
}

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);
  private refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
  private resetTokenRepository = AppDataSource.getRepository(ResetToken);

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
        { expiresIn: '1h' }
      );
      
      return token;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('JWT Sign Error (Auth Token)', { message: error.message });
        throw new Error('Failed to generate authentication token');
      }
      throw new Error('An unknown error occurred during token generation');
    }
  }

  private generateRefreshToken(user: User): string {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh', tokenId: uuidv4() },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return refreshToken;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('JWT Sign Error (Refresh Token)', { message: error.message });
        throw new Error('Failed to generate authentication token');
      }
      throw new Error('An unknown error occurred during token generation');
    }
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (req.connection.remoteAddress) ||
      'unknown'
    );
  }

  private getUserAgent(req: Request): string {
    return req.get('user-agent') || 'unknown';
  }

  async register(
    req: Request<object, object, RegisterRequest>,
    res: Response<AuthResponse | { error: string }>
  ): Promise<void> {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({ error: 'Username, email, and password are required' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long' });
        return;
      }
      if (password.length > 128) {
        res.status(400).json({ error: 'Password must not exceed 128 characters' });
        return;
      }

      const existingUser = await this.userRepository.findOne({ 
        where: [{ email }, { username }] 
      });
      
      if (existingUser) {
        // Return success to avoid email enumeration
        res.status(201).json({ 
          user: { id: 0, username: '', email: '' },
          token: 'dummy',
          refreshToken: 'dummy'
        });
        logger.info('Registration attempt with existing user', { email, username });
        return;
      }

      const user = new User();
      user.username = username;
      user.email = email;
      user.tokenVersion = 0;
      await user.setPassword(password);

      await this.userRepository.save(user);

      // Send welcome email (non-blocking)
      emailService.sendWelcomeEmail(email, username).catch(err => {
        logger.error('Failed to send welcome email', { email, error: String(err) });
      });

      const token = this.generateAuthToken(user);
      const refreshTokenStr = this.generateRefreshToken(user);

      // Store refresh token in database
      const refreshToken = new RefreshToken();
      refreshToken.userId = user.id;
      refreshToken.token = refreshTokenStr;
      refreshToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      refreshToken.ipAddress = this.getClientIp(req);
      refreshToken.userAgent = this.getUserAgent(req);
      await this.refreshTokenRepository.save(refreshToken);

      res.status(201).json({ 
        user: { id: user.id, username: user.username, email: user.email },
        token,
        refreshToken: refreshTokenStr
      });

      logger.info('User registered successfully', { userId: user.id, email, username });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Registration error', { message: error.message });
      } else {
        logger.error('An unknown error occurred during registration');
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(
    req: Request<object, object, LoginRequest>,
    res: Response<AuthResponse | { error: string }>
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
      await this.userRepository.save(user);

      const token = this.generateAuthToken(user);
      const refreshTokenStr = this.generateRefreshToken(user);

      // Store refresh token in database
      const refreshToken = new RefreshToken();
      refreshToken.userId = user.id;
      refreshToken.token = refreshTokenStr;
      refreshToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      refreshToken.ipAddress = this.getClientIp(req);
      refreshToken.userAgent = this.getUserAgent(req);
      await this.refreshTokenRepository.save(refreshToken);

      res.json({ 
        user: { id: user.id, username: user.username, email: user.email },
        token,
        refreshToken: refreshTokenStr
      });

      logger.info('User logged in successfully', { userId: user.id, email });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Login error', { message: error.message });
      } else {
        logger.error('An unknown error occurred during login');
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
        logger.error('Profile error', { message: error.message });
      } else {
        logger.error('An unknown error occurred while fetching profile');
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
        logger.error('Validate token error', { message: error.message });
      } else {
        logger.error('An unknown error occurred during token validation');
      }
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  async refreshToken(
    req: Request,
    res: Response<{ token: string; refreshToken: string } | { error: string }>
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      // Verify refresh token exists and is not revoked
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken, revoked: false }
      });

      if (!storedToken) {
        res.status(401).json({ error: 'Invalid refresh token' });
        return;
      }

      // Check if expired
      if (new Date() > storedToken.expiresAt) {
        await this.refreshTokenRepository.remove(storedToken);
        res.status(401).json({ error: 'Refresh token expired' });
        return;
      }

      // Verify JWT signature
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        res.status(500).json({ error: 'JWT_SECRET is not defined in environment variables' });
        return;
      }

      try {
        const decoded = jwt.verify(refreshToken, jwtSecret) as { userId: number; type: string };
        
        if (decoded.type !== 'refresh') {
          res.status(401).json({ error: 'Invalid token type' });
          return;
        }

        const user = await this.userRepository.findOne({ where: { id: decoded.userId } });
        if (!user) {
          await this.refreshTokenRepository.remove(storedToken);
          res.status(401).json({ error: 'User not found' });
          return;
        }

        // Generate new access token and refresh token
        const newToken = this.generateAuthToken(user);
        const newRefreshTokenStr = this.generateRefreshToken(user);

        // Revoke old refresh token and save new one
        storedToken.revoked = true;
        await this.refreshTokenRepository.save(storedToken);

        const newRefreshToken = new RefreshToken();
        newRefreshToken.userId = user.id;
        newRefreshToken.token = newRefreshTokenStr;
        newRefreshToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        newRefreshToken.ipAddress = this.getClientIp(req);
        newRefreshToken.userAgent = this.getUserAgent(req);
        await this.refreshTokenRepository.save(newRefreshToken);

        res.json({ token: newToken, refreshToken: newRefreshTokenStr });
        logger.info('Token refreshed successfully', { userId: user.id });
      } catch (jwtError) {
        res.status(401).json({ error: 'Invalid refresh token signature' });
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Refresh token error', { message: error.message });
      } else {
        logger.error('An unknown error occurred during token refresh');
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async forgotPassword(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const user = await this.userRepository.findOne({ where: { email } });
      
      // Always return success to avoid email enumeration attacks
      if (!user) {
        res.json({ message: 'If the email exists, a password reset link has been sent' });
        return;
      }

      // Generate reset token (UUID)
      const resetTokenStr = uuidv4();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Store reset token in database
      const resetToken = new ResetToken();
      resetToken.userId = user.id;
      resetToken.token = resetTokenStr;
      resetToken.expiresAt = expiresAt;
      resetToken.ipAddress = this.getClientIp(req);
      resetToken.userAgent = this.getUserAgent(req);
      await this.resetTokenRepository.save(resetToken);

      // Build reset link
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetTokenStr}`;

      // Send email with reset link
      const emailSent = await emailService.sendPasswordResetEmail(email, resetTokenStr, resetLink);

      res.json({ message: 'If the email exists, a password reset link has been sent' });

      if (emailSent) {
        logger.info('Password reset email sent', { userId: user.id, email });
      } else {
        logger.warn('Password reset email failed to send', { userId: user.id, email });
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Forgot password error', { message: error.message });
      } else {
        logger.error('An unknown error occurred during forgot password');
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async resetPassword(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { resetToken, newPassword } = req.body;

      if (!resetToken || !newPassword) {
        res.status(400).json({ error: 'Reset token and new password are required' });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long' });
        return;
      }
      if (newPassword.length > 128) {
        res.status(400).json({ error: 'Password must not exceed 128 characters' });
        return;
      }

      // Verify reset token
      const tokenData = await this.resetTokenRepository.findOne({
        where: { token: resetToken },
        relations: ['user']
      });

      if (!tokenData) {
        res.status(400).json({ error: 'Invalid or expired reset token' });
        return;
      }

      if (tokenData.used) {
        res.status(400).json({ error: 'Reset token has already been used' });
        return;
      }

      if (new Date() > tokenData.expiresAt) {
        await this.resetTokenRepository.remove(tokenData);
        res.status(400).json({ error: 'Reset token has expired' });
        return;
      }

      const user = tokenData.user;
      if (!user) {
        await this.resetTokenRepository.remove(tokenData);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Update password
      await user.setPassword(newPassword);
      
      // Invalidate all existing sessions
      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
      await this.userRepository.save(user);

      // Revoke all refresh tokens
      await this.refreshTokenRepository.update(
        { userId: user.id },
        { revoked: true }
      );

      // Mark reset token as used
      tokenData.used = true;
      tokenData.usedAt = new Date();
      await this.resetTokenRepository.save(tokenData);

      logger.info('Password reset successful', { userId: user.id, email: user.email });
      res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Reset password error', { message: error.message });
      } else {
        logger.error('An unknown error occurred during password reset');
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

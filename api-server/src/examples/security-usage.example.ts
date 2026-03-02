/**
 * Example: Integrating Security Features into Controllers
 * 
 * This file demonstrates how to use the security utilities and monitoring
 * systems in your Express controllers.
 */

import type { Request, Response } from 'express';
import {
  validateEmail,
  validatePassword,
  sanitizeString,
} from '../utils/validation';
import {
  securityMonitor,
  SecurityEventType,
} from '../utils/security-monitor';
import { logAudit, AUDIT_ACTIONS } from '../utils/audit';
import { getClientIP } from '../utils/ip-security';
import logger from '../config/logger';

/**
 * Example 1: Secure Login Handler
 */
export async function exampleLoginHandler(req: Request, res: Response) {
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const { email, password } = req.body;

  try {
    // Step 1: Validate input
    if (!validateEmail(email)) {
      logAudit(
        AUDIT_ACTIONS.LOGIN_FAILED,
        clientIP,
        userAgent,
        'failure',
        { email, reason: 'Invalid email format' }
      );

      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Step 2: Sanitize inputs
    const sanitizedEmail = sanitizeString(email);

    // Step 3: Authenticate user (your existing logic)
    // const user = await findUser(sanitizedEmail);
    // if (!user || !await verifyPassword(password, user.passwordHash)) {
    //   // Record failed login attempt
    //   securityMonitor.recordEvent(
    //     SecurityEventType.FAILED_LOGIN,
    //     'medium',
    //     clientIP,
    //     { email: sanitizedEmail, attempt: 1 }
    //   );

    //   logAudit(
    //     AUDIT_ACTIONS.LOGIN_FAILED,
    //     clientIP,
    //     userAgent,
    //     'failure',
    //     { email: sanitizedEmail, reason: 'Invalid credentials' }
    //   );

    //   return res.status(401).json({ error: 'Invalid credentials' });
    // }

    // Step 4: Log successful login
    logAudit(
      AUDIT_ACTIONS.LOGIN_SUCCESS,
      clientIP,
      userAgent,
      'success',
      { userId: 'user_id', email: sanitizedEmail }
    );

    // Step 5: Return JWT (your existing logic)
    // const token = generateJWT({ id: user.id }, JWT_SECRET);
    // res.json({ token });
  } catch (error) {
    logger.error('Login error:', error);

    securityMonitor.recordEvent(
      SecurityEventType.SUSPICIOUS_REQUEST,
      'high',
      clientIP,
      { path: '/api/auth/login', error: String(error) }
    );

    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Example 2: Secure Registration Handler
 */
export async function exampleRegisterHandler(req: Request, res: Response) {
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const { email, password, username } = req.body;

  try {
    // Step 1: Validate email
    if (!validateEmail(email)) {
      logAudit(
        AUDIT_ACTIONS.REGISTER_FAILED,
        clientIP,
        userAgent,
        'failure',
        { email, reason: 'Invalid email format' }
      );

      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Step 2: Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      logAudit(
        AUDIT_ACTIONS.REGISTER_FAILED,
        clientIP,
        userAgent,
        'failure',
        { email, reason: 'Password too weak', errors: passwordCheck.errors }
      );

      return res.status(400).json({
        error: 'Password does not meet security requirements',
        details: passwordCheck.errors,
      });
    }

    // Step 3: Sanitize inputs
    const sanitizedEmail = sanitizeString(email);
    const sanitizedUsername = sanitizeString(username);

    // Step 4: Check if user already exists (your existing logic)
    // const existingUser = await findUser(sanitizedEmail);
    // if (existingUser) {
    //   logAudit(
    //     AUDIT_ACTIONS.REGISTER_FAILED,
    //     clientIP,
    //     userAgent,
    //     'failure',
    //     { email: sanitizedEmail, reason: 'User already exists' }
    //   );

    //   return res.status(409).json({ error: 'User already exists' });
    // }

    // Step 5: Create user (your existing logic)
    // const newUser = await createUser({
    //   email: sanitizedEmail,
    //   username: sanitizedUsername,
    //   password: await hashPassword(password),
    // });

    // Step 6: Log successful registration
    logAudit(
      AUDIT_ACTIONS.REGISTER_SUCCESS,
      clientIP,
      userAgent,
      'success',
      { userId: 'new_user_id', email: sanitizedEmail }
    );

    res.status(201).json({
      message: 'User registered successfully',
      // userId: newUser.id,
    });
  } catch (error) {
    logger.error('Registration error:', error);

    securityMonitor.recordEvent(
      SecurityEventType.SUSPICIOUS_REQUEST,
      'medium',
      clientIP,
      { path: '/api/auth/register', error: String(error) }
    );

    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Example 3: Secure Password Reset Handler
 */
export async function exampleResetPasswordHandler(req: Request, res: Response) {
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const { token, password } = req.body;

  try {
    // Step 1: Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      logAudit(
        AUDIT_ACTIONS.PASSWORD_RESET_FAILED,
        clientIP,
        userAgent,
        'failure',
        { reason: 'Password too weak' }
      );

      return res.status(400).json({
        error: 'Password does not meet security requirements',
        details: passwordCheck.errors,
      });
    }

    // Step 2: Verify token (your existing logic)
    // const resetTokenData = await verifyResetToken(token);
    // if (!resetTokenData) {
    //   logAudit(
    //     AUDIT_ACTIONS.PASSWORD_RESET_FAILED,
    //     clientIP,
    //     userAgent,
    //     'failure',
    //     { reason: 'Invalid or expired token' }
    //   );

    //   securityMonitor.recordEvent(
    //     SecurityEventType.INVALID_TOKEN,
    //     'medium',
    //     clientIP,
    //     { path: '/api/auth/reset-password', token: token.substring(0, 10) }
    //   );

    //   return res.status(400).json({ error: 'Invalid or expired reset token' });
    // }

    // Step 3: Update password (your existing logic)
    // await updateUserPassword(resetTokenData.userId, password);
    // await invalidateResetToken(token);

    // Step 4: Log successful password reset
    logAudit(
      AUDIT_ACTIONS.PASSWORD_RESET_SUCCESS,
      clientIP,
      userAgent,
      'success',
      { userId: 'user_id' }
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Password reset error:', error);

    securityMonitor.recordEvent(
      SecurityEventType.SUSPICIOUS_REQUEST,
      'medium',
      clientIP,
      { path: '/api/auth/reset-password', error: String(error) }
    );

    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Example 4: Secure User Deletion Handler
 */
export async function exampleDeleteUserHandler(req: Request, res: Response) {
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const userId = (req as any).user?.id; // Assuming JWT middleware

  try {
    // Step 1: Authorization check (already done by auth middleware)

    // Step 2: Delete user (your existing logic)
    // await deleteUser(userId);

    // Step 3: Invalidate all sessions (your existing logic)
    // await invalidateAllSessions(userId);

    // Step 4: Log account deletion
    logAudit(
      AUDIT_ACTIONS.ACCOUNT_DELETED,
      clientIP,
      userAgent,
      'success',
      { userId }
    );

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Account deletion error:', error);

    securityMonitor.recordEvent(
      SecurityEventType.SUSPICIOUS_REQUEST,
      'medium',
      clientIP,
      { path: '/api/auth/delete', error: String(error) }
    );

    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Example 5: API Endpoint with Security Monitoring
 */
export async function exampleSecureApiHandler(req: Request, res: Response) {
  const clientIP = getClientIP(req);
  const startTime = Date.now();

  try {
    // Your business logic here
    const result = await fetchSecureData();

    const responseTime = Date.now() - startTime;

    // Log successful operation
    logger.info('Secure API call successful', {
      endpoint: req.path,
      ip: clientIP,
      responseTime: `${responseTime}ms`,
    });

    res.json(result);
  } catch (error) {
    logger.error('Secure API error:', error);

    // Record security event for errors
    securityMonitor.recordEvent(
      SecurityEventType.SUSPICIOUS_REQUEST,
      'medium',
      clientIP,
      { path: req.path, error: String(error) }
    );

    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Example 6: Admin Endpoint with Enhanced Security
 */
export async function exampleAdminHandler(req: Request, res: Response) {
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;

  try {
    // Step 1: Check role
    if (userRole !== 'admin') {
      securityMonitor.recordEvent(
        SecurityEventType.PRIVILEGE_ESCALATION,
        'high',
        clientIP,
        { userId, attempt: 'admin_access', role: userRole }
      );

      logAudit(
        AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
        clientIP,
        userAgent,
        'failure',
        { userId, reason: 'Unauthorized admin access attempt' }
      );

      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Step 2: Perform admin action (your logic)
    const result = await performAdminAction();

    // Step 3: Log sensitive operation
    logAudit(
      AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
      clientIP,
      userAgent,
      'success',
      { userId, action: 'admin_operation' }
    );

    res.json(result);
  } catch (error) {
    logger.error('Admin operation error:', error);

    securityMonitor.recordEvent(
      SecurityEventType.SUSPICIOUS_REQUEST,
      'high',
      clientIP,
      { path: req.path, userId, error: String(error) }
    );

    res.status(500).json({ error: 'Internal server error' });
  }
}

// Placeholder functions for examples
async function fetchSecureData() {
  return { data: 'secure' };
}

async function performAdminAction() {
  return { success: true };
}

/**
 * Integration Example in Express App
 * 
 * import { exampleLoginHandler, exampleRegisterHandler } from './examples/security-usage';
 * 
 * app.post('/api/auth/login', loginRateLimit, (req, res) => exampleLoginHandler(req, res));
 * app.post('/api/auth/register', registerRateLimit, (req, res) => exampleRegisterHandler(req, res));
 */


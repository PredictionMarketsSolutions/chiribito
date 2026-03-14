import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../config/logger';

/**
 * CSRF Protection Middleware
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_COOKIE = 'x-csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing requests
 */
export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate token for client if not exists
  let token = req.cookies?.[CSRF_TOKEN_COOKIE];
  
  if (!token) {
    token = generateCSRFToken();
    res.cookie(CSRF_TOKEN_COOKIE, token, {
      httpOnly: false, // Must be readable by client-side JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });
  }
  
  // Store token on request for later use
  req.csrfToken = () => token;
  
  // Skip CSRF validation for safe methods
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }
  
  // Get token from request (header or body)
  const clientToken = 
    req.headers[CSRF_TOKEN_HEADER] as string ||
    (req.body && typeof req.body === 'object' ? (req.body as any)._csrf : undefined);
  
  // Validate token
  if (!clientToken || clientToken !== token) {
    logger.warn('CSRF token validation failed', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      hasToken: !!clientToken,
    });
    
    res.status(403).json({
      error: 'CSRF token validation failed',
    });
    return;
  }
  
  next();
}

/**
 * Augment Express Response with csrfToken method
 */
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      csrfToken?: () => string;
    }
  }
}

/**
 * Middleware to provide CSRF token in responses
 */
export function csrfTokenProvider(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Add CSRF token to response locals for templating
  if (typeof _req.csrfToken === 'function') {
    res.locals.csrfToken = _req.csrfToken();
  }
  
  next();
}

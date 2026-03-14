import logger from '../config/logger';
import * as jsonwebtoken from 'jsonwebtoken';

/**
 * JWT Authentication for Colyseus game server
 */

export interface PlayerJWTPayload {
  id: string;
  email: string;
  username: string;
  type?: 'player';
  iat?: number;
  exp?: number;
}

/**
 * Verify JWT token from client
 */

export function verifyPlayerToken(token: string, secret: string): { valid: boolean; payload?: PlayerJWTPayload; error?: string } {
  try {
    const decoded = jsonwebtoken.verify(token, secret) as PlayerJWTPayload;
    
    // Validate required fields
    if (!decoded.id || !decoded.email || !decoded.username) {
      return { valid: false, error: 'Missing required claim in token' };
    }
    
    return { valid: true, payload: decoded };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid token';
    return {
      valid: false,
      error: errorMessage,
    };
  }
}

/**
 * Extract JWT from client options
 */
export function extractTokenFromOptions(options: any): string | null {
  if (!options) return null;
  
  // Check token in options.auth
  if (options.auth?.token) {
    return options.auth.token;
  }
  
  // Check token directly in options
  if (options.token) {
    return options.token;
  }
  
  // Check Authorization header
  if (options.headers?.authorization) {
    const authHeader = options.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }
  
  return null;
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  action: 'join' | 'rejoin' | 'auth_failed' | 'invalid_token' | 'token_expired',
  playerId: string,
  details: Record<string, any> = {}
): void {
  logger.info(`[GAME_AUTH] ${action}`, {
    playerId,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * Cookie/Session management for Colyseus
 */
export class ColyseusTokenManager {
  private sessions = new Map<string, { token: string; playerId: string; expiresAt: number }>();
  private sessionTimeout = 3600000; // 1 hour

  /**
   * Register a session
   */
  registerSession(sessionId: string, token: string, playerId: string): void {
    this.sessions.set(sessionId, {
      token,
      playerId,
      expiresAt: Date.now() + this.sessionTimeout,
    });
  }

  /**
   * Validate session
   */
  validateSession(sessionId: string): { valid: boolean; playerId?: string; error?: string } {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { valid: false, error: 'Session not found' };
    }
    
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return { valid: false, error: 'Session expired' };
    }
    
    return { valid: true, playerId: session.playerId };
  }

  /**
   * Invalidate session (logout)
   */
  invalidateSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Refresh session timeout
   */
  refreshSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.expiresAt = Date.now() + this.sessionTimeout;
      return true;
    }
    return false;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): number {
    // Clean up expired sessions
    for (const [key, session] of this.sessions) {
      if (Date.now() > session.expiresAt) {
        this.sessions.delete(key);
      }
    }
    return this.sessions.size;
  }
}

export const tokenManager = new ColyseusTokenManager();

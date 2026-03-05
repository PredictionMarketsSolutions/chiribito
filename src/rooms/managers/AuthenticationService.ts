/**
 * AuthenticationService.ts
 * Handles JWT token validation and user authentication
 */

import * as jwt from "jsonwebtoken";
import { Client } from "@colyseus/core";
import logger from "../../config/logger";
import { SessionManager } from "./SessionManager";

export interface AuthConfig {
  apiUrl: string;
  jwtSecret: string;
  maxRetries?: number;
  retryDelayMs?: number;
  requestTimeoutMs?: number;
}

export interface AuthResult {
  authUser: any;
  replaceSessionId?: string;
}

export class AuthenticationService {
  private readonly config: Required<AuthConfig>;

  constructor(
    private roomId: string,
    config: AuthConfig
  ) {
    this.config = {
      apiUrl: config.apiUrl,
      jwtSecret: config.jwtSecret,
      maxRetries: config.maxRetries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 500,
      requestTimeoutMs: config.requestTimeoutMs ?? 8000
    };
  }

  /**
   * Extract JWT token from options
   */
  private extractToken(options: any): string | null {
    return options?.token || 
           options?.auth?.token ||
           (options?.headers && typeof options.headers.authorization === 'string'
             ? options.headers.authorization.split(' ')[1]
             : null);
  }

  /**
   * Validate JWT before allowing join
   * Called by Colyseus when a client tries to join
   */
  async requestJoin(options: any): Promise<boolean> {
    if (!options?.authUser) {
      logger.warn("Request join without authUser", { roomId: this.roomId });
      return false;
    }
    return true;
  }

  /**
   * Authenticate a client with JWT token
   * Called by Colyseus during connection handshake
   */
  async authenticate(
    client: Client,
    options: any,
    sessionManager: SessionManager
  ): Promise<AuthResult> {
    const token = this.extractToken(options);

    if (!token) {
      throw new Error("NO_TOKEN");
    }

    if (!this.config.jwtSecret) {
      logger.error("JWT_SECRET not set on server", { roomId: this.roomId });
      throw new Error("SERVER_CONFIG");
    }

    // Verify JWT signature
    const decoded = jwt.verify(token, this.config.jwtSecret) as any;
    
    // Validate token remotely with API server
    await this.validateTokenRemote(token);
    
    options.authUser = decoded;

    const userId = Number(decoded?.userId);
    if (!Number.isFinite(userId)) {
      throw new Error("INVALID_TOKEN");
    }

    // Check for existing sessions
    const hasActiveSession = sessionManager.hasActiveSession(userId);
    const isPending = sessionManager.isPending(userId);

    if ((hasActiveSession || isPending) && !options?.forceReplace) {
      throw new Error("SESSION_EXISTS");
    }

    const result: AuthResult = {
      authUser: decoded
    };

    // Allow session replacement if forced
    if (hasActiveSession && options?.forceReplace) {
      result.replaceSessionId = sessionManager.getSessionId(userId) ?? undefined;
    }

    // Mark as pending until onJoin completes
    sessionManager.addPending(userId);
    
    return result;
  }

  /**
   * Validate token with API server using exponential backoff
   * Ensures token is still valid and user still exists
   */
  private async validateTokenRemote(token: string): Promise<void> {
    const { maxRetries, retryDelayMs, requestTimeoutMs, apiUrl } = this.config;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

      try {
        const response = await fetch(`${apiUrl}/api/auth/validate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("INVALID_TOKEN");
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        // Token valid
        return;
      } catch (err) {
        clearTimeout(timeoutId);
        
        const isLastAttempt = attempt >= maxRetries;
        const isAuthError = err instanceof Error && err.message === "INVALID_TOKEN";
        
        // Don't retry auth errors - fail immediately
        if (isAuthError) {
          throw err;
        }
        
        // For network errors, use exponential backoff
        if (isLastAttempt) {
          logger.error(`Token validation failed after ${maxRetries} attempts`, { 
            error: String(err), 
            roomId: this.roomId 
          });
          throw new Error("AUTH_UNAVAILABLE");
        }
        
        // Exponential backoff: 500ms, 1s, 2s, etc.
        const delayMs = retryDelayMs * Math.pow(2, attempt - 1);
        logger.warn(`Token validation attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms`, { 
          roomId: this.roomId 
        });
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<AuthConfig>> {
    return { ...this.config };
  }
}

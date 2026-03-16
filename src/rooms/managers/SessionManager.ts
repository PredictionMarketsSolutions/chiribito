/**
 * SessionManager.ts
 * Manages user sessions, authentication state, and player reconnections
 */

import type { Client } from "@colyseus/core";
import logger from "../../config/logger";

export class SessionManager {
  // userId -> sessionId mapping (current active session per user)
  private activeUsers: Map<number, string> = new Map();
  
  // sessionId -> userId mapping (reverse lookup)
  private sessionUsers: Map<string, number> = new Map();

  // userId -> playerName mapping (for richer logging)
  private userNames: Map<number, string> = new Map();
  
  // Users in the process of joining (prevents double joins)
  private pendingUsers: Set<number> = new Set();

  constructor(
    private roomId: string,
    private reconnectionTimeoutSeconds: number = 60
  ) {}

  /**
   * Check if a user already has an active session
   */
  hasActiveSession(userId: number): boolean {
    return this.activeUsers.has(userId);
  }

  /**
   * Check if a user is currently joining
   */
  isPending(userId: number): boolean {
    return this.pendingUsers.has(userId);
  }

  /**
   * Get the sessionId for a userId
   */
  getSessionId(userId: number): string | undefined {
    return this.activeUsers.get(userId);
  }

  /**
   * Get the userId for a sessionId
   */
  getUserId(sessionId: string): number | undefined {
    return this.sessionUsers.get(sessionId);
  }

  /**
   * Mark a user as pending (joining in progress)
   */
  addPending(userId: number): void {
    this.pendingUsers.add(userId);
  }

  /**
   * Register a new session
   */
  registerSession(userId: number, sessionId: string, playerName?: string): void {
    this.activeUsers.set(userId, sessionId);
    this.sessionUsers.set(sessionId, userId);
    this.pendingUsers.delete(userId);

    if (playerName) {
      this.userNames.set(userId, playerName);
    }

    logger.info("Session registered", {
      userId,
      sessionId,
      roomId: this.roomId,
      playerName: playerName ?? this.userNames.get(userId)
    });
  }

  /**
   * Remove a session (on disconnect)
   */
  removeSession(sessionId: string): void {
    const userId = this.sessionUsers.get(sessionId);
    if (userId !== undefined) {
      const playerName = this.userNames.get(userId);
      this.activeUsers.delete(userId);
      this.sessionUsers.delete(sessionId);
      this.userNames.delete(userId);
      
      logger.info("Session removed", {
        userId,
        sessionId,
        roomId: this.roomId,
        playerName
      });
    }
  }

  /**
   * Replace an old session with a new one (reconnection/force replace)
   */
  replaceSession(oldSessionId: string, newSessionId: string): void {
    const userId = this.sessionUsers.get(oldSessionId);
    if (userId === undefined) {
      logger.warn("Attempted to replace non-existent session", {
        oldSessionId,
        roomId: this.roomId
      });
      return;
    }

    // Update mappings
    this.activeUsers.set(userId, newSessionId);
    this.sessionUsers.delete(oldSessionId);
    this.sessionUsers.set(newSessionId, userId);

    logger.info("Session replaced", {
      userId,
      oldSessionId,
      newSessionId,
      roomId: this.roomId,
      playerName: this.userNames.get(userId)
    });
  }

  /**
   * Clear all sessions (on room dispose)
   */
  clearAll(): void {
    this.activeUsers.clear();
    this.sessionUsers.clear();
    this.pendingUsers.clear();
    this.userNames.clear();
    
    logger.info("All sessions cleared", { roomId: this.roomId });
  }

  /**
   * Get total active sessions
   */
  getActiveCount(): number {
    return this.activeUsers.size;
  }

  /**
   * Get all active session IDs
   */
  getAllSessionIds(): string[] {
    return Array.from(this.sessionUsers.keys());
  }
}

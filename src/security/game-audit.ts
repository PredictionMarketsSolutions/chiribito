import logger from '../config/logger';

/**
 * Game audit logging for security and fairness
 */

export interface GameAuditEvent {
  type: string;
  roomId: string;
  playerId: string;
  timestamp: number;
  details: Record<string, any>;
}

export enum GameAuditEventType {
  PLAYER_JOIN = 'player_join',
  PLAYER_LEAVE = 'player_leave',
  PLAYER_REJOIN = 'player_rejoin',
  HAND_START = 'hand_start',
  HAND_END = 'hand_end',
  ACTION_TAKEN = 'action_taken',
  ACTION_INVALID = 'action_invalid',
  POT_UPDATE = 'pot_update',
  WINNER_DECLARED = 'winner_declared',
  CHEAT_DETECTED = 'cheat_detected',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',
  TIMEOUT = 'timeout',
  NETWORK_ISSUE = 'network_issue',
}

export class GameAuditLog {
  private events: GameAuditEvent[] = [];
  private readonly maxEvents = 10000;
  private readonly retentionMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Record a game audit event
   */
  recordEvent(
    type: string,
    roomId: string,
    playerId: string,
    details: Record<string, any> = {}
  ): void {
    const event: GameAuditEvent = {
      type,
      roomId,
      playerId,
      timestamp: Date.now(),
      details,
    };

    this.events.push(event);

    // Log to Winston logger based on type
    this.logEvent(event);

    // Maintain max size
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  /**
   * Internal logging by event type
   */
  private logEvent(event: GameAuditEvent): void {
    const logData = {
      type: event.type,
      roomId: event.roomId,
      playerId: event.playerId,
      timestamp: new Date(event.timestamp).toISOString(),
      ...event.details,
    };

    // Log critical events as errors/warns
    if (
      event.type === GameAuditEventType.CHEAT_DETECTED ||
      event.type === GameAuditEventType.ACTION_INVALID
    ) {
      logger.warn(`[GAME_AUDIT] ${event.type}`, logData);
    } else if (
      event.type === GameAuditEventType.TIMEOUT ||
      event.type === GameAuditEventType.NETWORK_ISSUE
    ) {
      logger.info(`[GAME_AUDIT] ${event.type}`, logData);
    } else {
      logger.debug(`[GAME_AUDIT] ${event.type}`, logData);
    }
  }

  /**
   * Get events for a specific room
   */
  getRoomEvents(roomId: string, limit: number = 100): GameAuditEvent[] {
    return this.events
      .filter(e => e.roomId === roomId)
      .slice(-limit);
  }

  /**
   * Get events for a specific player
   */
  getPlayerEvents(playerId: string, limit: number = 100): GameAuditEvent[] {
    return this.events
      .filter(e => e.playerId === playerId)
      .slice(-limit);
  }

  /**
   * Get events of a specific type
   */
  getEventsByType(type: string, limit: number = 100): GameAuditEvent[] {
    return this.events
      .filter(e => e.type === type)
      .slice(-limit);
  }

  /**
   * Get cheat detection events
   */
  getCheatDetectionEvents(limit: number = 50): GameAuditEvent[] {
    return this.events
      .filter(e => e.type === GameAuditEventType.CHEAT_DETECTED)
      .slice(-limit);
  }

  /**
   * Get invalid action events
   */
  getInvalidActionEvents(limit: number = 50): GameAuditEvent[] {
    return this.events
      .filter(e => e.type === GameAuditEventType.ACTION_INVALID)
      .slice(-limit);
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalEvents: number;
    cheatDetections: number;
    invalidActions: number;
    timeouts: number;
    networkIssues: number;
    activeRooms: number;
    activePlayers: number;
  } {
    const cheatDetections = this.events.filter(
      e => e.type === GameAuditEventType.CHEAT_DETECTED
    ).length;
    const invalidActions = this.events.filter(
      e => e.type === GameAuditEventType.ACTION_INVALID
    ).length;
    const timeouts = this.events.filter(
      e => e.type === GameAuditEventType.TIMEOUT
    ).length;
    const networkIssues = this.events.filter(
      e => e.type === GameAuditEventType.NETWORK_ISSUE
    ).length;

    const activeRooms = new Set(this.events.map(e => e.roomId)).size;
    const activePlayers = new Set(this.events.map(e => e.playerId)).size;

    return {
      totalEvents: this.events.length,
      cheatDetections,
      invalidActions,
      timeouts,
      networkIssues,
      activeRooms,
      activePlayers,
    };
  }

  /**
   * Clear old events (older than retention period)
   */
  clearOldEvents(): number {
    const cutoffTime = Date.now() - this.retentionMs;
    const initialLength = this.events.length;
    this.events = this.events.filter(e => e.timestamp > cutoffTime);
    return initialLength - this.events.length;
  }

  /**
   * Export events as JSON (for backup/analysis)
   */
  exportEvents(filters?: { roomId?: string; playerId?: string; type?: string }): string {
    let filtered = this.events;

    if (filters?.roomId) {
      filtered = filtered.filter(e => e.roomId === filters.roomId);
    }
    if (filters?.playerId) {
      filtered = filtered.filter(e => e.playerId === filters.playerId);
    }
    if (filters?.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    return JSON.stringify(filtered, null, 2);
  }

  /**
   * Clear all events (use with caution)
   */
  clear(): void {
    this.events = [];
  }
}

// Global singleton instance
export const gameAuditLog = new GameAuditLog();

/**
 * Helper functions for common audit logging patterns
 */

export function auditPlayerAction(
  roomId: string,
  playerId: string,
  action: string,
  amount?: number,
  details: Record<string, any> = {}
): void {
  gameAuditLog.recordEvent(
    GameAuditEventType.ACTION_TAKEN,
    roomId,
    playerId,
    {
      action,
      amount,
      ...details,
    }
  );
}

export function auditInvalidAction(
  roomId: string,
  playerId: string,
  action: string,
  reason: string,
  details: Record<string, any> = {}
): void {
  gameAuditLog.recordEvent(
    GameAuditEventType.ACTION_INVALID,
    roomId,
    playerId,
    {
      action,
      reason,
      ...details,
    }
  );
}

export function auditCheatDetection(
  roomId: string,
  playerId: string,
  cheatingType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any> = {}
): void {
  gameAuditLog.recordEvent(
    GameAuditEventType.CHEAT_DETECTED,
    roomId,
    playerId,
    {
      cheatingType,
      severity,
      ...details,
    }
  );
}

export function auditPlayerJoin(
  roomId: string,
  playerId: string,
  details: Record<string, any> = {}
): void {
  gameAuditLog.recordEvent(
    GameAuditEventType.PLAYER_JOIN,
    roomId,
    playerId,
    details
  );
}

export function auditPlayerLeave(
  roomId: string,
  playerId: string,
  reason: string,
  details: Record<string, any> = {}
): void {
  gameAuditLog.recordEvent(
    GameAuditEventType.PLAYER_LEAVE,
    roomId,
    playerId,
    {
      reason,
      ...details,
    }
  );
}

/**
 * AnalyticsService.ts
 * Tracks connection statistics and game analytics
 */

import logger from "../../config/logger";

export interface ConnectionStats {
  joinTime: number;
  leaveTime?: number;
  disconnections: number;
  reconnections: number;
  messagesReceived: number;
  messagesSent: number;
  actionsPerformed: number;
  errors: number;
}

export interface AnalyticsSummary {
  totalConnections: number;
  currentConnections: number;
  averageSessionDurationMs: number;
  totalDisconnections: number;
  totalReconnections: number;
  totalMessages: number;
  totalActions: number;
  totalErrors: number;
}

export class AnalyticsService {
  private connectionStats: Map<string, ConnectionStats> = new Map();
  private logInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(
    private roomId: string,
    private logIntervalMs: number = 300000 // 5 minutes
  ) {}

  /**
   * Start periodic analytics logging
   */
  start(): void {
    if (this.isRunning) {
      logger.warn("AnalyticsService already running", { roomId: this.roomId });
      return;
    }

    this.isRunning = true;
    this.logInterval = setInterval(() => {
      this.logSummary();
    }, this.logIntervalMs);

    logger.info("AnalyticsService started", {
      roomId: this.roomId,
      intervalMs: this.logIntervalMs
    });
  }

  /**
   * Stop periodic logging
   */
  stop(): void {
    if (this.logInterval) {
      clearInterval(this.logInterval);
      this.logInterval = null;
    }
    this.isRunning = false;

    logger.info("AnalyticsService stopped", { roomId: this.roomId });
  }

  /**
   * Record a new connection
   */
  recordConnection(sessionId: string): void {
    this.connectionStats.set(sessionId, {
      joinTime: Date.now(),
      disconnections: 0,
      reconnections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      actionsPerformed: 0,
      errors: 0
    });

    logger.debug("Connection recorded", {
      sessionId,
      roomId: this.roomId
    });
  }

  /**
   * Record a disconnection
   */
  recordDisconnection(sessionId: string): void {
    const stats = this.connectionStats.get(sessionId);
    if (stats) {
      stats.leaveTime = Date.now();
      stats.disconnections++;
    }

    logger.debug("Disconnection recorded", {
      sessionId,
      roomId: this.roomId
    });
  }

  /**
   * Record a reconnection
   */
  recordReconnection(sessionId: string): void {
    const stats = this.connectionStats.get(sessionId);
    if (stats) {
      stats.reconnections++;
      delete stats.leaveTime; // Client is back online
    }

    logger.debug("Reconnection recorded", {
      sessionId,
      roomId: this.roomId
    });
  }

  /**
   * Record a message received from client
   */
  recordMessageReceived(sessionId: string): void {
    const stats = this.connectionStats.get(sessionId);
    if (stats) {
      stats.messagesReceived++;
    }
  }

  /**
   * Record a message sent to client
   */
  recordMessageSent(sessionId: string): void {
    const stats = this.connectionStats.get(sessionId);
    if (stats) {
      stats.messagesSent++;
    }
  }

  /**
   * Record a game action performed by client
   */
  recordAction(sessionId: string): void {
    const stats = this.connectionStats.get(sessionId);
    if (stats) {
      stats.actionsPerformed++;
    }
  }

  /**
   * Record an error for a client
   */
  recordError(sessionId: string): void {
    const stats = this.connectionStats.get(sessionId);
    if (stats) {
      stats.errors++;
    }
  }

  /**
   * Get stats for a specific session
   */
  getSessionStats(sessionId: string): ConnectionStats | undefined {
    return this.connectionStats.get(sessionId);
  }

  /**
   * Get session duration in milliseconds
   */
  getSessionDuration(sessionId: string): number | undefined {
    const stats = this.connectionStats.get(sessionId);
    if (!stats) return undefined;

    const endTime = stats.leaveTime ?? Date.now();
    return endTime - stats.joinTime;
  }

  /**
   * Generate analytics summary
   */
  generateSummary(): AnalyticsSummary {
    let totalDisconnections = 0;
    let totalReconnections = 0;
    let totalMessages = 0;
    let totalActions = 0;
    let totalErrors = 0;
    let totalSessionDurationMs = 0;
    let sessionCount = 0;
    let currentConnections = 0;

    for (const [sessionId, stats] of this.connectionStats.entries()) {
      totalDisconnections += stats.disconnections;
      totalReconnections += stats.reconnections;
      totalMessages += stats.messagesReceived + stats.messagesSent;
      totalActions += stats.actionsPerformed;
      totalErrors += stats.errors;

      const duration = this.getSessionDuration(sessionId);
      if (duration !== undefined) {
        totalSessionDurationMs += duration;
        sessionCount++;
      }

      if (!stats.leaveTime) {
        currentConnections++;
      }
    }

    return {
      totalConnections: this.connectionStats.size,
      currentConnections,
      averageSessionDurationMs: sessionCount > 0 ? totalSessionDurationMs / sessionCount : 0,
      totalDisconnections,
      totalReconnections,
      totalMessages,
      totalActions,
      totalErrors
    };
  }

  /**
   * Log analytics summary
   */
  logSummary(): void {
    const summary = this.generateSummary();
    
    logger.info("Analytics summary", {
      roomId: this.roomId,
      ...summary,
      averageSessionDurationMinutes: (summary.averageSessionDurationMs / 60000).toFixed(2)
    });
  }

  /**
   * Remove stats for a session (cleanup)
   */
  removeSession(sessionId: string): void {
    this.connectionStats.delete(sessionId);
  }

  /**
   * Clear all analytics (on room dispose)
   */
  clearAll(): void {
    this.stop();
    this.connectionStats.clear();
    
    logger.info("AnalyticsService cleared", { roomId: this.roomId });
  }

  /**
   * Get total tracked sessions
   */
  getTotalSessions(): number {
    return this.connectionStats.size;
  }

  /**
   * Get currently active sessions
   */
  getActiveSessions(): number {
    let count = 0;
    for (const stats of this.connectionStats.values()) {
      if (!stats.leaveTime) {
        count++;
      }
    }
    return count;
  }
}

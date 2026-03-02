import logger from '../config/logger';

/**
 * Rate limiting specifically for game actions (not HTTP)
 * Prevents action spam, rapid-fire betting, and DoS attacks
 */

export interface ActionRateLimit {
  action: string;
  maxActionsPerSecond: number;
  cooldownMs: number;
  maxActionsPerHand: number;
}

export interface PlayerRateData {
  lastActionTime: number;
  lastAction: string;
  actionCount: number;
  handActionCount: number;
  violationCount: number;
  bannedUntil?: number;
}

// Default rate limits for poker actions
export const DEFAULT_ACTION_LIMITS: Record<string, ActionRateLimit> = {
  fold: {
    action: 'fold',
    maxActionsPerSecond: 1,
    cooldownMs: 500,
    maxActionsPerHand: 1,
  },
  check: {
    action: 'check',
    maxActionsPerSecond: 1,
    cooldownMs: 500,
    maxActionsPerHand: 10,
  },
  call: {
    action: 'call',
    maxActionsPerSecond: 1,
    cooldownMs: 500,
    maxActionsPerHand: 10,
  },
  raise: {
    action: 'raise',
    maxActionsPerSecond: 0.5,
    cooldownMs: 1000,
    maxActionsPerHand: 5,
  },
  all_in: {
    action: 'all_in',
    maxActionsPerSecond: 0.33,
    cooldownMs: 2000,
    maxActionsPerHand: 1,
  },
  bet: {
    action: 'bet',
    maxActionsPerSecond: 0.5,
    cooldownMs: 1000,
    maxActionsPerHand: 5,
  },
};

export class GameActionRateLimiter {
  private playerData: Map<string, PlayerRateData> = new Map();
  private handReset: Map<string, number> = new Map(); // Track when hands started for reset
  private readonly banDurationMs = 5 * 60 * 1000; // 5 minute ban
  private readonly violationThreshold = 5; // Ban after 5 violations

  /**
   * Check if player can perform an action
   * Returns { allowed: boolean, reason?: string }
   */
  canPerformAction(
    playerId: string,
    action: string,
    config: ActionRateLimit = DEFAULT_ACTION_LIMITS[action]
  ): { allowed: boolean; reason?: string } {
    // Check if player is banned
    const data = this.playerData.get(playerId);
    if (data?.bannedUntil && data.bannedUntil > Date.now()) {
      return {
        allowed: false,
        reason: `Player banned until ${new Date(data.bannedUntil).toISOString()}`,
      };
    }

    // Clear ban if expired
    if (data?.bannedUntil && data.bannedUntil <= Date.now()) {
      data.bannedUntil = undefined;
      data.violationCount = 0;
    }

    // Initialize if not exists
    if (!data) {
      this.playerData.set(playerId, {
        lastActionTime: 0,
        lastAction: '',
        actionCount: 0,
        handActionCount: 0,
        violationCount: 0,
      });
      return { allowed: true };
    }

    const now = Date.now();

    // Check cooldown between actions
    if (now - data.lastActionTime < config.cooldownMs) {
      data.violationCount++;
      return {
        allowed: false,
        reason: `Action cooldown not met. Minimum ${config.cooldownMs}ms required, only ${now - data.lastActionTime}ms elapsed`,
      };
    }

    // Check max actions per second
    const recentActionsInSecond = this.countRecentActions(playerId, 1000);
    if (recentActionsInSecond >= config.maxActionsPerSecond) {
      data.violationCount++;
      return {
        allowed: false,
        reason: `Exceeded ${config.maxActionsPerSecond} actions per second limit`,
      };
    }

    // Check max actions per hand
    if (data.handActionCount >= config.maxActionsPerHand) {
      data.violationCount++;
      return {
        allowed: false,
        reason: `Exceeded ${config.maxActionsPerHand} ${action} actions per hand`,
      };
    }

    // Check for violent action patterns (e.g., rapid all-ins)
    if (action === 'all_in') {
      const recentAllIns = this.countRecentActionsByType(playerId, 'all_in', 10000);
      if (recentAllIns > 2) {
        data.violationCount++;
        return {
          allowed: false,
          reason: 'Too many all-in actions in short time window',
        };
      }
    }

    // Action is allowed
    return { allowed: true };
  }

  /**
   * Record that an action was performed
   */
  recordAction(
    playerId: string,
    action: string,
    isValidation: boolean = false
  ): void {
    const data =
      this.playerData.get(playerId) ||
      {
        lastActionTime: 0,
        lastAction: '',
        actionCount: 0,
        handActionCount: 0,
        violationCount: 0,
      };

    const now = Date.now();
    data.lastActionTime = now;
    data.lastAction = action;
    data.actionCount++;
    data.handActionCount++;

    this.playerData.set(playerId, data);

    logger.debug(`[RATE_LIMIT] Action recorded: ${action} for player ${playerId}`);
  }

  /**
   * Record a rate limit violation
   */
  recordViolation(
    playerId: string,
    reason: string,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): boolean {
    const data = this.playerData.get(playerId);
    if (!data) {
      return false;
    }

    data.violationCount++;

    logger.warn(
      `[RATE_LIMIT] Violation recorded for ${playerId}. Violations: ${data.violationCount}. Reason: ${reason}. Severity: ${severity}`
    );

    // Auto-ban after threshold violations
    if (data.violationCount >= this.violationThreshold) {
      this.banPlayer(playerId, `Exceeded ${this.violationThreshold} violations`);
      return true; // Player was banned
    }

    return false;
  }

  /**
   * Ban a player temporarily
   */
  banPlayer(playerId: string, reason: string = 'Rule violation'): void {
    const data = this.playerData.get(playerId);
    if (data) {
      data.bannedUntil = Date.now() + this.banDurationMs;
      logger.error(
        `[RATE_LIMIT] Player ${playerId} banned for ${this.banDurationMs}ms. Reason: ${reason}`
      );
    }
  }

  /**
   * Unban a player
   */
  unbanPlayer(playerId: string): void {
    const data = this.playerData.get(playerId);
    if (data) {
      data.bannedUntil = undefined;
      data.violationCount = 0;
      logger.info(`[RATE_LIMIT] Player ${playerId} unbanned`);
    }
  }

  /**
   * Reset hand counters for a player
   */
  resetHandCounters(playerId: string): void {
    const data = this.playerData.get(playerId);
    if (data) {
      data.handActionCount = 0;
      this.handReset.set(playerId, Date.now());
    }
  }

  /**
   * Count recent actions (all types) in time window
   */
  private countRecentActions(playerId: string, windowMs: number): number {
    const data = this.playerData.get(playerId);
    if (!data) return 0;

    const now = Date.now();
    const cutoff = now - windowMs;

    // Simple approximation: if last action was within window, count as 1
    // In production, maintain action history array
    return data.lastActionTime > cutoff ? 1 : 0;
  }

  /**
   * Count recent actions of a specific type in time window
   */
  private countRecentActionsByType(
    playerId: string,
    action: string,
    windowMs: number
  ): number {
    const data = this.playerData.get(playerId);
    if (!data) return 0;

    const now = Date.now();
    const cutoff = now - windowMs;

    // Simple approximation
    return data.lastAction === action && data.lastActionTime > cutoff ? 1 : 0;
  }

  /**
   * Get player rate limit status
   */
  getPlayerStatus(playerId: string): PlayerRateData | undefined {
    return this.playerData.get(playerId);
  }

  /**
   * Get all players exceeding violation threshold
   */
  getSuspiciousPlayers(): Array<{
    playerId: string;
    violations: number;
    banned: boolean;
  }> {
    const suspicious: Array<{
      playerId: string;
      violations: number;
      banned: boolean;
    }> = [];

    for (const [playerId, data] of this.playerData) {
      if (data.violationCount > 2 || data.bannedUntil) {
        suspicious.push({
          playerId,
          violations: data.violationCount,
          banned: data.bannedUntil ? true : false,
        });
      }
    }

    return suspicious;
  }

  /**
   * Get rate limit statistics
   */
  getStatistics(): {
    totalPlayers: number;
    bannedPlayers: number;
    playersWithViolations: number;
    totalViolations: number;
  } {
    let bannedPlayers = 0;
    let playersWithViolations = 0;
    let totalViolations = 0;

    for (const data of this.playerData.values()) {
      if (data.bannedUntil && data.bannedUntil > Date.now()) {
        bannedPlayers++;
      }
      if (data.violationCount > 0) {
        playersWithViolations++;
        totalViolations += data.violationCount;
      }
    }

    return {
      totalPlayers: this.playerData.size,
      bannedPlayers,
      playersWithViolations,
      totalViolations,
    };
  }

  /**
   * Clean up old player data
   */
  cleanup(inactiveMs: number = 3600000): number {
    // Remove players inactive for more than 1 hour
    let removed = 0;
    const now = Date.now();

    for (const [playerId, data] of this.playerData) {
      if (now - data.lastActionTime > inactiveMs) {
        this.playerData.delete(playerId);
        this.handReset.delete(playerId);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info(
        `[RATE_LIMIT] Cleaned up ${removed} inactive players from rate limiter`
      );
    }

    return removed;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.playerData.clear();
    this.handReset.clear();
  }
}

// Global singleton instance
export const gameActionRateLimiter = new GameActionRateLimiter();

/**
 * Helper function to check and record action in one call
 */
export function checkAndRecordAction(
  playerId: string,
  action: string,
  config?: ActionRateLimit
): { allowed: boolean; reason?: string } {
  const check = gameActionRateLimiter.canPerformAction(playerId, action, config);

  if (check.allowed) {
    gameActionRateLimiter.recordAction(playerId, action);
  } else {
    gameActionRateLimiter.recordViolation(playerId, check.reason || 'Unknown', 'medium');
  }

  return check;
}

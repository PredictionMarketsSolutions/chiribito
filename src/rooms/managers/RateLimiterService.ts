/**
 * RateLimiterService.ts
 * Manages action cooldowns to prevent spam and abuse
 */

import logger from "../../config/logger";

export interface RateLimitConfig {
  defaultCooldownMs: number;
  customCooldowns?: Map<string, number>;
}

export class RateLimiterService {
  // sessionId -> (actionType -> lastTimestamp)
  private actionCooldowns: Map<string, Map<string, number>> = new Map();
  
  constructor(
    private roomId: string,
    private config: RateLimitConfig
  ) {}

  /**
   * Check if an action is allowed (cooldown expired)
   */
  isActionAllowed(sessionId: string, actionType: string): boolean {
    const clientCooldowns = this.actionCooldowns.get(sessionId);
    if (!clientCooldowns) return true;

    const lastActionTime = clientCooldowns.get(actionType);
    if (!lastActionTime) return true;

    const cooldownMs = this.getCooldownForAction(actionType);
    const timeSinceLastAction = Date.now() - lastActionTime;

    return timeSinceLastAction >= cooldownMs;
  }

  /**
   * Record an action (set cooldown timer)
   */
  recordAction(sessionId: string, actionType: string): void {
    let clientCooldowns = this.actionCooldowns.get(sessionId);
    
    if (!clientCooldowns) {
      clientCooldowns = new Map();
      this.actionCooldowns.set(sessionId, clientCooldowns);
    }

    clientCooldowns.set(actionType, Date.now());

    logger.debug("Action recorded", {
      sessionId,
      actionType,
      roomId: this.roomId
    });
  }

  /**
   * Get remaining cooldown time in milliseconds
   */
  getRemainingCooldown(sessionId: string, actionType: string): number {
    const clientCooldowns = this.actionCooldowns.get(sessionId);
    if (!clientCooldowns) return 0;

    const lastActionTime = clientCooldowns.get(actionType);
    if (!lastActionTime) return 0;

    const cooldownMs = this.getCooldownForAction(actionType);
    const timeSinceLastAction = Date.now() - lastActionTime;
    const remaining = cooldownMs - timeSinceLastAction;

    return Math.max(0, remaining);
  }

  /**
   * Get cooldown duration for a specific action type
   */
  private getCooldownForAction(actionType: string): number {
    if (this.config.customCooldowns?.has(actionType)) {
      return this.config.customCooldowns.get(actionType)!;
    }
    return this.config.defaultCooldownMs;
  }

  /**
   * Clear all cooldowns for a client
   */
  clearClient(sessionId: string): void {
    this.actionCooldowns.delete(sessionId);
    
    logger.debug("Client cooldowns cleared", {
      sessionId,
      roomId: this.roomId
    });
  }

  /**
   * Clear a specific action cooldown for a client
   */
  clearAction(sessionId: string, actionType: string): void {
    const clientCooldowns = this.actionCooldowns.get(sessionId);
    if (clientCooldowns) {
      clientCooldowns.delete(actionType);
    }
  }

  /**
   * Reset all cooldowns (on room dispose)
   */
  clearAll(): void {
    this.actionCooldowns.clear();
    
    logger.info("RateLimiterService cleared", { roomId: this.roomId });
  }

  /**
   * Get active cooldown count for a client
   */
  getActiveCooldownCount(sessionId: string): number {
    const clientCooldowns = this.actionCooldowns.get(sessionId);
    return clientCooldowns?.size ?? 0;
  }

  /**
   * Get all action types currently on cooldown for a client
   */
  getActiveCooldowns(sessionId: string): string[] {
    const clientCooldowns = this.actionCooldowns.get(sessionId);
    if (!clientCooldowns) return [];

    const now = Date.now();
    const activeCooldowns: string[] = [];

    for (const [actionType, lastActionTime] of clientCooldowns.entries()) {
      const cooldownMs = this.getCooldownForAction(actionType);
      const timeSinceLastAction = now - lastActionTime;

      if (timeSinceLastAction < cooldownMs) {
        activeCooldowns.push(actionType);
      }
    }

    return activeCooldowns;
  }

  /**
   * Update cooldown config at runtime
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    if (config.defaultCooldownMs !== undefined) {
      this.config.defaultCooldownMs = config.defaultCooldownMs;
    }
    if (config.customCooldowns !== undefined) {
      this.config.customCooldowns = config.customCooldowns;
    }

    logger.info("RateLimiterService config updated", {
      roomId: this.roomId,
      config
    });
  }
}

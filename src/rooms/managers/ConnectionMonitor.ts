/**
 * ConnectionMonitor.ts
 * Monitors client connections via heartbeat mechanism
 */

import logger from "../../config/logger";

export interface ConnectionMonitorConfig {
  heartbeatIntervalMs: number;
  heartbeatTimeoutMs: number;
}

export class ConnectionMonitor {
  private heartbeats: Map<string, number> = new Map();
  private monitorInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(
    private roomId: string,
    private config: ConnectionMonitorConfig,
    private onClientTimeout: (sessionId: string) => void
  ) {}

  /**
   * Start heartbeat monitoring
   */
  start(): void {
    if (this.isRunning) {
      logger.warn("ConnectionMonitor already running", { roomId: this.roomId });
      return;
    }

    this.isRunning = true;
    this.monitorInterval = setInterval(() => {
      this.checkHeartbeats();
    }, this.config.heartbeatIntervalMs);

    logger.info("ConnectionMonitor started", {
      roomId: this.roomId,
      intervalMs: this.config.heartbeatIntervalMs
    });
  }

  /**
   * Stop heartbeat monitoring
   */
  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isRunning = false;

    logger.info("ConnectionMonitor stopped", { roomId: this.roomId });
  }

  /**
   * Register or update a client heartbeat
   */
  recordHeartbeat(sessionId: string): void {
    this.heartbeats.set(sessionId, Date.now());
  }

  /**
   * Remove a client from monitoring
   */
  removeClient(sessionId: string): void {
    this.heartbeats.delete(sessionId);
  }

  /**
   * Check all clients for timeouts
   */
  private checkHeartbeats(): void {
    const now = Date.now();
    const timeoutMs = this.config.heartbeatTimeoutMs;

    for (const [sessionId, lastHeartbeat] of this.heartbeats.entries()) {
      const timeSinceLastHeartbeat = now - lastHeartbeat;

      if (timeSinceLastHeartbeat > timeoutMs) {
        logger.warn("Client heartbeat timeout", {
          sessionId,
          roomId: this.roomId,
          timeSinceLastMs: timeSinceLastHeartbeat,
          timeoutMs
        });

        this.heartbeats.delete(sessionId);
        this.onClientTimeout(sessionId);
      }
    }
  }

  /**
   * Get current monitored client count
   */
  getMonitoredCount(): number {
    return this.heartbeats.size;
  }

  /**
   * Check if a client is being monitored
   */
  isMonitored(sessionId: string): boolean {
    return this.heartbeats.has(sessionId);
  }

  /**
   * Get time since last heartbeat for a client
   */
  getTimeSinceLastHeartbeat(sessionId: string): number | undefined {
    const lastHeartbeat = this.heartbeats.get(sessionId);
    if (lastHeartbeat === undefined) return undefined;
    return Date.now() - lastHeartbeat;
  }

  /**
   * Clear all heartbeats (on room dispose)
   */
  clearAll(): void {
    this.stop();
    this.heartbeats.clear();
    
    logger.info("ConnectionMonitor cleared", { roomId: this.roomId });
  }
}

import logger from '../config/logger';

/**
 * Security event monitoring and alerting
 */

export interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface SecurityAlert {
  id: string;
  event: SecurityEvent;
  action: string;
  acknowledged: boolean;
}

/**
 * Security event types and thresholds
 */
export enum SecurityEventType {
  FAILED_LOGIN = 'failed_login',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_token',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
}

/**
 * Security monitor to track and alert on security events
 */
export class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private thresholds = {
    failedLoginAttempts: 5,
    requestsPerMinute: 100,
    uniqueParameterCount: 50,
  };
  private eventHandlers: Map<string, (event: SecurityEvent) => void> = new Map();

  /**
   * Record a security event
   */
  recordEvent(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    source: string,
    details: Record<string, any>
  ): void {
    const event: SecurityEvent = {
      type,
      severity,
      source,
      details,
      timestamp: new Date(),
    };

    this.events.push(event);

    // Log based on severity
    const logMessage = `Security Event: ${type} [${severity.toUpperCase()}]`;
    switch (severity) {
      case 'critical':
        logger.error(logMessage, event);
        this.createAlert(event, 'IMMEDIATE_ACTION_REQUIRED');
        break;
      case 'high':
        logger.warn(logMessage, event);
        this.createAlert(event, 'INVESTIGATION_REQUIRED');
        break;
      case 'medium':
        logger.info(logMessage, event);
        break;
      case 'low':
        logger.debug(logMessage, event);
        break;
    }

    // Call registered handlers
    const handlers = this.eventHandlers.get(type) || this.eventHandlers.get('*');
    if (handlers) {
      try {
        handlers(event);
      } catch (error) {
        logger.error('Error in security event handler', { error: String(error) });
      }
    }

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }
  }

  /**
   * Create a security alert
   */
  private createAlert(event: SecurityEvent, action: string): void {
    const alert: SecurityAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      event,
      action,
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.splice(0, this.alerts.length - 100);
    }
  }

  /**
   * Register handler for specific event type
   */
  on(eventType: string | '*', handler: (event: SecurityEvent) => void): void {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: string, limit: number = 50): SecurityEvent[] {
    return this.events.filter(e => e.type === type).slice(-limit);
  }

  /**
   * Get events by severity
   */
  getEventsBySeverity(
    severity: 'low' | 'medium' | 'high' | 'critical',
    limit: number = 50
  ): SecurityEvent[] {
    return this.events.filter(e => e.severity === severity).slice(-limit);
  }

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts(): SecurityAlert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Get security summary
   */
  getSummary(): {
    totalEvents: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    unacknowledgedAlerts: number;
  } {
    return {
      totalEvents: this.events.length,
      criticalCount: this.events.filter(e => e.severity === 'critical').length,
      highCount: this.events.filter(e => e.severity === 'high').length,
      mediumCount: this.events.filter(e => e.severity === 'medium').length,
      lowCount: this.events.filter(e => e.severity === 'low').length,
      unacknowledgedAlerts: this.alerts.filter(a => !a.acknowledged).length,
    };
  }

  /**
   * Clear events older than specified time
   */
  clearOldEvents(hoursOld: number = 24): number {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    const initialLength = this.events.length;
    this.events = this.events.filter(e => e.timestamp > cutoffTime);
    return initialLength - this.events.length;
  }
}

// Global security monitor instance
export const securityMonitor = new SecurityMonitor();

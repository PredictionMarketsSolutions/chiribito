import logger from '../config/logger';

export interface AuditLog {
  action: string;
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  details?: Record<string, any>;
  timestamp: Date;
}

/**
 * Log security-sensitive operations to audit trail
 */
export function logAudit(
  action: string,
  ipAddress: string,
  userAgent: string,
  status: 'success' | 'failure',
  details?: {
    userId?: string;
    email?: string;
    reason?: string;
    [key: string]: any;
  }
): void {
  const auditLog: AuditLog = {
    action,
    ipAddress,
    userAgent,
    status,
    timestamp: new Date(),
    ...details,
  };

  if (status === 'failure') {
    logger.warn(`AUDIT: ${action}`, auditLog);
  } else {
    logger.info(`AUDIT: ${action}`, auditLog);
  }
}

/**
 * Audit actions to track
 */
export const AUDIT_ACTIONS = {
  LOGIN_ATTEMPT: 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  REGISTER_ATTEMPT: 'REGISTER_ATTEMPT',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILED: 'REGISTER_FAILED',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS',
  PASSWORD_RESET_FAILED: 'PASSWORD_RESET_FAILED',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
} as const;

export type AuditAction = ValueOf<typeof AUDIT_ACTIONS>;

type ValueOf<T> = T[keyof T];

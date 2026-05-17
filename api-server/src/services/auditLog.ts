/**
 * auditLog.ts
 *
 * Best-effort persistent audit log. Use `auditWrite()` from request handlers
 * to record security-relevant events (login, register, refresh, password
 * reset, tournament end, etc.).
 *
 * Guarantees:
 *   - Never throws. If the DB is down, we log a warning and move on.
 *   - Best-effort: returns a Promise<void> that resolves regardless.
 *   - Schema-stable: avoid storing sensitive material in `payload` —
 *     tokens, password hashes, raw cookies, full headers.
 */

import type { Request } from 'express';
import { AppDataSource } from '../config/database';
import { AuditEvent } from '../models/AuditEvent';
import logger from '../config/logger';

export const AuditEventType = {
  USER_REGISTERED:               'user.registered',
  USER_REGISTRATION_DUPLICATE:   'user.registration_duplicate',
  USER_LOGIN_OK:                 'user.login_ok',
  USER_LOGIN_FAILED:             'user.login_failed',
  USER_TOKEN_REFRESHED:          'user.token_refreshed',
  USER_TOKEN_REFRESH_FAILED:     'user.token_refresh_failed',
  USER_PASSWORD_RESET_REQUESTED: 'user.password_reset_requested',
  USER_PASSWORD_RESET_COMPLETED: 'user.password_reset_completed',
  USER_DELETED:                  'user.deleted',
  TOURNAMENT_REPORTED:           'tournament.reported'
} as const;

export type AuditEventTypeValue = (typeof AuditEventType)[keyof typeof AuditEventType];

export interface AuditInput {
  eventType: AuditEventTypeValue;
  userId?: number | null;
  payload?: Record<string, unknown>;
  req?: Request;
}

function clientIp(req?: Request): string | null {
  if (!req) return null;
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]!.trim() || null;
  }
  return req.socket?.remoteAddress ?? null;
}

function userAgent(req?: Request): string | null {
  if (!req) return null;
  return req.get('user-agent') ?? null;
}

export async function auditWrite(input: AuditInput): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      logger.warn('auditWrite skipped — DataSource not initialised', {
        eventType: input.eventType
      });
      return;
    }
    const repo = AppDataSource.getRepository(AuditEvent);
    const row = repo.create({
      eventType: input.eventType,
      userId: input.userId ?? null,
      payload: input.payload ?? {},
      ipAddress: clientIp(input.req),
      userAgent: userAgent(input.req)
    });
    await repo.save(row);
  } catch (err) {
    logger.warn('auditWrite failed', {
      eventType: input.eventType,
      userId: input.userId ?? null,
      error: err instanceof Error ? err.message : String(err)
    });
  }
}

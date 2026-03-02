/**
 * Game Server Security Layer
 * Comprehensive security for Colyseus poker game server
 */

// Authentication and Session Management
export {
  verifyPlayerToken,
  extractTokenFromOptions,
  logAuthEvent,
  tokenManager,
  ColyseusTokenManager,
  type PlayerJWTPayload,
} from './game-auth';

// Anti-Cheat System
export {
  detectSuspiciousAction,
  detectStateManipulation,
  detectCollusion,
  detectNetworkAnomaly,
  logCheatDetection,
  type CheatDetectionResult,
} from './anti-cheat';

// Game Action Validation
export {
  validatePokerAction,
  validateBetAmount,
  validatePlayerTurn,
  validateGameStateConsistency,
  logGameAction,
  type GameValidationResult,
} from './game-validation';

// Game Audit Logging
export {
  gameAuditLog,
  auditPlayerAction,
  auditInvalidAction,
  auditCheatDetection,
  auditPlayerJoin,
  auditPlayerLeave,
  GameAuditEventType,
  type GameAuditEvent,
} from './game-audit';

// Game Action Rate Limiting
export {
  gameActionRateLimiter,
  checkAndRecordAction,
  DEFAULT_ACTION_LIMITS,
  type ActionRateLimit,
  type PlayerRateData,
} from './game-action-rate-limit';

// Import instances for quick access
import { tokenManager } from './game-auth';
import { gameAuditLog } from './game-audit';
import { gameActionRateLimiter } from './game-action-rate-limit';

// Quick access to security instances
export const GameSecurityManager = {
  auth: tokenManager,
  audit: gameAuditLog,
  rateLimiter: gameActionRateLimiter,
};

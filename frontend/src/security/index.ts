/**
 * Frontend security layer for Chiribito poker client
 * Comprehensive security for web-based game client
 */

// Import functions for use in this file
import { initAuthClient, getAuthClient } from './auth-client';
import { initApiClient, getApiClient } from './api-client';
import { SecureStorage } from './secure-storage';
import { stateGuard } from './state-guard';

// Secure storage
export {
  tokenExpiryMonitor,
  SecureStorage,
  TokenExpiryMonitor,
  type StorageOptions,
  type StoredToken,
} from './secure-storage';

// Authentication client
export {
  initAuthClient,
  getAuthClient,
  decodeJWT,
  isJWTExpired,
  extractUserFromJWT,
  AuthClient,
  type AuthCredentials,
  type JWTPayload,
  type AuthResponse,
  type AuthState,
} from './auth-client';

// API client
export {
  initApiClient,
  getApiClient,
  ApiClient,
  type ApiResponse,
  type ApiRequestOptions,
} from './api-client';

// Input validation
export {
  validateEmail,
  validatePassword,
  validateUsername,
  validateBetAmount,
  validatePlayerStack,
  validatePokerAction,
  sanitizeString,
  validateUUID,
  validateFormData,
  validateLoginForm,
  validateRegisterForm,
  validateBetAction,
  inputValidators,
  type ValidationResult,
} from './input-validator';

// State protection
export {
  stateGuard,
  StateGuard,
  StateProtectionMiddleware,
  validateGameState,
  sanitizeGameState,
  type State,
  type StateSnapshot,
  type ChangedField,
  type StateChange,
} from './state-guard';

/**
 * Initialization helper - returns security instances
 * Call this once at app startup with your API URL
 */
export function initFrontendSecurity(apiUrl: string) {
  // Initialize auth client
  const authClient = initAuthClient(apiUrl);

  // Initialize API client
  const apiClient = initApiClient(apiUrl);

  console.log('[SECURITY] Frontend security initialized');

  return {
    auth: authClient,
    api: apiClient,
    storage: SecureStorage,
    state: stateGuard,
  };
}

/**
 * Frontend security configuration
 */
export const FrontendSecurityConfig = {
  // Token refresh settings
  TokenExpiry: {
    checkIntervalMs: 60000, // Check every minute
    refreshThresholdMs: 300000, // Refresh when <5 min left
    warningThresholdMs: 600000, // Warn when <10 min left
  },

  // Security timeouts
  Timeouts: {
    apiRequest: 30000, // 30 seconds
    tokenRefresh: 5000, // 5 seconds
    heartbeat: 25000, // 25 seconds
  },

  // Input validation rules
  Validation: {
    emailMaxLength: 255,
    usernameMinLength: 3,
    usernameMaxLength: 50,
    passwordMinLength: 8,
    passwordMaxLength: 128,
    betMaxAmount: 1000000,
    stackMaxAmount: 10000000,
  },

  // Storage settings
  Storage: {
    useSessionStorage: true, // For access token
    useLocalStorage: true, // For refresh token
    encryptRefreshToken: false, // Set to false by default (use httpOnly cookies in production)
  },

  // Security features
  Features: {
    autoTokenRefresh: true,
    stateIntegrityCheck: true,
    inputSanitization: true,
    csrfProtection: true,
    xssProtection: true,
  },
};

/**
 * Security health check
 */
export async function checkSecurityHealth(): Promise<{
  auth: boolean;
  storage: boolean;
  api: boolean;
  overall: boolean;
}> {
  const auth = typeof window !== 'undefined';
  const storage = typeof sessionStorage !== 'undefined';
  const api = typeof fetch !== 'undefined';

  return {
    auth,
    storage,
    api,
    overall: auth && storage && api,
  };
}

/**
 * Clear all security data (on logout)
 */export function clearSecurityData(): void {
  SecureStorage.clearAllTokens();
  stateGuard.clear();

  console.log('[SECURITY] All security data cleared');
}

export default {
  initFrontendSecurity,
  checkSecurityHealth,
  clearSecurityData,
  FrontendSecurityConfig,
};

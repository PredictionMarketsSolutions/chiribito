/**
 * Secure token storage management
 * Handles JWT token persistence with optional encryption
 */

export interface StorageOptions {
  encrypted?: boolean;
  expiresIn?: number; // milliseconds
}

export interface StoredToken {
  value: string;
  expiresAt?: number;
  encrypted: boolean;
}

/**
 * Simple XOR encryption (NOT cryptographically secure)
 * For better security, replace with TweetNaCl.js or similar
 */
function simpleEncrypt(text: string, key: string = 'secret'): string {
  let encrypted = '';
  for (let i = 0; i < text.length; i++) {
    encrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted); // Base64 encode
}

function simpleDecrypt(encrypted: string, key: string = 'secret'): string {
  try {
    const decoded = atob(encrypted); // Base64 decode
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  } catch (error) {
    console.error('[STORAGE] Decryption failed:', error);
    return '';
  }
}

export class SecureStorage {
  private static readonly STORAGE_KEY = 'chiri_auth_token';
  private static readonly REFRESH_KEY = 'chiri_refresh_token';
  private static readonly EXPIRY_KEY = 'chiri_token_expiry';
  private static readonly LAST_ROOM_KEY = 'chiri_last_room_id';
  private static readonly RECONNECT_KEY = 'chiri_reconnection_token';

  /**
   * Save access token to memory/storage
   */
  static saveAccessToken(token: string, expiresIn?: number): void {
    try {
      const expiresAt = expiresIn ? Date.now() + expiresIn : undefined;
      
      // Store token in sessionStorage for security (cleared on tab close)
      sessionStorage.setItem(this.STORAGE_KEY, token);
      
      if (expiresAt) {
        sessionStorage.setItem(this.EXPIRY_KEY, expiresAt.toString());
      }

      console.log('[STORAGE] Access token saved to sessionStorage');
    } catch (error) {
      console.error('[STORAGE] Failed to save access token:', error);
    }
  }

  /**
   * Save refresh token (persisted across sessions)
   * NOTE: In production, use httpOnly cookies instead
   */
  static saveRefreshToken(token: string, encrypt: boolean = false): void {
    try {
      const storageValue = encrypt ? simpleEncrypt(token) : token;
      localStorage.setItem(this.REFRESH_KEY, storageValue);
      console.log('[STORAGE] Refresh token saved to localStorage');
    } catch (error) {
      console.error('[STORAGE] Failed to save refresh token:', error);
    }
  }

  /**
   * Get access token from storage
   */
  static getAccessToken(): string | null {
    try {
      const token = sessionStorage.getItem(this.STORAGE_KEY);
      
      if (!token) {
        return null;
      }

      // Check expiry
      const expiryStr = sessionStorage.getItem(this.EXPIRY_KEY);
      if (expiryStr) {
        const expiresAt = parseInt(expiryStr, 10);
        if (Date.now() > expiresAt) {
          console.warn('[STORAGE] Access token expired');
          this.clearAccessToken();
          return null;
        }
      }

      return token;
    } catch (error) {
      console.error('[STORAGE] Failed to retrieve access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token from storage
   */
  static getRefreshToken(encrypted: boolean = false): string | null {
    try {
      let token = localStorage.getItem(this.REFRESH_KEY);
      
      if (!token) {
        return null;
      }

      if (encrypted) {
        token = simpleDecrypt(token);
      }

      return token || null;
    } catch (error) {
      console.error('[STORAGE] Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Clear access token
   */
  static clearAccessToken(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.EXPIRY_KEY);
      console.log('[STORAGE] Access token cleared');
    } catch (error) {
      console.error('[STORAGE] Failed to clear access token:', error);
    }
  }

  /**
   * Clear refresh token
   */
  static clearRefreshToken(): void {
    try {
      localStorage.removeItem(this.REFRESH_KEY);
      console.log('[STORAGE] Refresh token cleared');
    } catch (error) {
      console.error('[STORAGE] Failed to clear refresh token:', error);
    }
  }

  /**
   * Clear all tokens (logout)
   */
  static clearAllTokens(): void {
    this.clearAccessToken();
    this.clearRefreshToken();
    this.clearReconnectionToken();
    console.log('[STORAGE] All tokens cleared');
  }

  /**
   * Persist last joined room id so we can auto-rejoin after login.
   */
  static saveLastRoomId(roomId: string): void {
    try {
      localStorage.setItem(this.LAST_ROOM_KEY, roomId);
      console.log('[STORAGE] Last room id saved');
    } catch (error) {
      console.error('[STORAGE] Failed to save last room id:', error);
    }
  }

  static getLastRoomId(): string | null {
    try {
      return localStorage.getItem(this.LAST_ROOM_KEY);
    } catch (error) {
      console.error('[STORAGE] Failed to get last room id:', error);
      return null;
    }
  }

  static clearLastRoomId(): void {
    try {
      localStorage.removeItem(this.LAST_ROOM_KEY);
      console.log('[STORAGE] Last room id cleared');
    } catch (error) {
      console.error('[STORAGE] Failed to clear last room id:', error);
    }
  }

  /**
   * Persist the Colyseus `reconnectionToken` returned by the last successful
   * room join. Used by the recovery path (`client.reconnect(token)`) to
   * resume the seat held by `allowReconnection` on the server without going
   * through the `onAuth` SESSION_EXISTS gate.
   *
   * Stored in sessionStorage on purpose: the token is meaningless once the
   * tab closes (the 60-second server window almost always expires before
   * the user reopens), and we never want to leak it across tabs (Move 5
   * multi-tab semantics rely on SESSION_EXISTS staying active for the
   * second tab).
   */
  static saveReconnectionToken(token: string): void {
    try {
      sessionStorage.setItem(this.RECONNECT_KEY, token);
      console.log('[STORAGE] Reconnection token saved');
    } catch (error) {
      console.error('[STORAGE] Failed to save reconnection token:', error);
    }
  }

  static getReconnectionToken(): string | null {
    try {
      return sessionStorage.getItem(this.RECONNECT_KEY);
    } catch (error) {
      console.error('[STORAGE] Failed to get reconnection token:', error);
      return null;
    }
  }

  static clearReconnectionToken(): void {
    try {
      sessionStorage.removeItem(this.RECONNECT_KEY);
      console.log('[STORAGE] Reconnection token cleared');
    } catch (error) {
      console.error('[STORAGE] Failed to clear reconnection token:', error);
    }
  }

  /**
   * Check if token exists
   */
  static hasAccessToken(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Check if token is expired
   */
  static isAccessTokenExpired(): boolean {
    const expiryStr = sessionStorage.getItem(this.EXPIRY_KEY);
    if (!expiryStr) {
      return false;
    }

    const expiresAt = parseInt(expiryStr, 10);
    return Date.now() > expiresAt;
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  static getAccessTokenExpiresIn(): number | null {
    const expiryStr = sessionStorage.getItem(this.EXPIRY_KEY);
    if (!expiryStr) {
      return null;
    }

    const expiresAt = parseInt(expiryStr, 10);
    const expiresIn = expiresAt - Date.now();

    return expiresIn > 0 ? expiresIn : null;
  }

  /**
   * Set token expiry warning threshold (e.g., refresh if <5 minutes remaining)
   */
  static shouldRefreshToken(thresholdMs: number = 300000): boolean {
    const expiresIn = this.getAccessTokenExpiresIn();
    return expiresIn !== null && expiresIn < thresholdMs;
  }

  /**
   * Clear old/invalid tokens on security event
   */
  static clearOnSecurityEvent(reason: string): void {
    console.warn(`[STORAGE] Security event: ${reason} - clearing tokens`);
    this.clearAllTokens();
  }

  /**
   * Get storage stats for debugging
   */
  static getStats(): {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    accessTokenExpired: boolean;
    expiresInMs: number | null;
  } {
    return {
      hasAccessToken: this.hasAccessToken(),
      hasRefreshToken: this.getRefreshToken() !== null,
      accessTokenExpired: this.isAccessTokenExpired(),
      expiresInMs: this.getAccessTokenExpiresIn(),
    };
  }
}

/**
 * Token expiry monitor
 * Automatically tracks token expiry and triggers refresh
 */
export class TokenExpiryMonitor {
  private monitorId: number | null = null;
  private readonly checkIntervalMs = 60000; // Check every minute
  private readonly refreshThresholdMs = 300000; // Refresh when <5 minutes left
  private onRefreshNeeded: (() => void) | null = null;
  private onExpired: (() => void) | null = null;

  /**
   * Start monitoring token expiry
   */
  startMonitoring(
    onRefreshNeeded?: () => void,
    onExpired?: () => void
  ): void {
    if (this.monitorId !== null) {
      return; // Already monitoring
    }

    this.onRefreshNeeded = onRefreshNeeded || null;
    this.onExpired = onExpired || null;

    this.monitorId = window.setInterval(() => {
      this.check();
    }, this.checkIntervalMs);

    console.log('[MONITOR] Token expiry monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorId !== null) {
      clearInterval(this.monitorId);
      this.monitorId = null;
      console.log('[MONITOR] Token expiry monitoring stopped');
    }
  }

  /**
   * Check token expiry status
   */
  private check(): void {
    if (!SecureStorage.hasAccessToken()) {
      if (this.onExpired) {
        this.onExpired();
      }
      return;
    }

    if (SecureStorage.isAccessTokenExpired()) {
      if (this.onExpired) {
        this.onExpired();
      }
      this.stopMonitoring();
      return;
    }

    if (SecureStorage.shouldRefreshToken(this.refreshThresholdMs)) {
      if (this.onRefreshNeeded) {
        this.onRefreshNeeded();
      }
    }
  }

  /**
   * Destroy monitor
   */
  destroy(): void {
    this.stopMonitoring();
  }
}

export const tokenExpiryMonitor = new TokenExpiryMonitor();

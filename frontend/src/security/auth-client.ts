/**
 * Client-side JWT authentication management
 * Handles login, logout, token refresh, and session management
 */

import { SecureStorage, TokenExpiryMonitor } from './secure-storage';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
  error?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  username: string | null;
  tokenExpiry: number | null;
  lastRefresh: number | null;
}

/**
 * Decode JWT payload (without verification - client-side only)
 * WARNING: This does not verify the token signature
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[AUTH] Invalid JWT format');
      return null;
    }

    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('[AUTH] Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if JWT is expired (client-side check only)
 */
export function isJWTExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return false;
  }

  const expiryTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() > expiryTime;
}

/**
 * Extract user info from JWT
 */
export function extractUserFromJWT(token: string): JWTPayload | null {
  return decodeJWT(token);
}

/**
 * Main authentication client
 */
export class AuthClient {
  private apiUrl: string;
  private state: AuthState;
  private expiryMonitor: TokenExpiryMonitor;
  private refreshInProgress = false;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.state = {
      isAuthenticated: false,
      userId: null,
      email: null,
      username: null,
      tokenExpiry: null,
      lastRefresh: null,
    };
    this.expiryMonitor = new TokenExpiryMonitor();
  }

  /**
   * Initialize auth client
   * Restores session if refresh token exists
   */
  async initialize(): Promise<void> {
    const refreshToken = SecureStorage.getRefreshToken();
    
    if (refreshToken) {
      console.log('[AUTH] Refresh token found, attempting to restore session');
      const success = await this.refreshAccessToken(refreshToken);
      
      if (success) {
        this.startTokenMonitor();
      } else {
        console.warn('[AUTH] Failed to restore session');
        this.logout();
      }
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Validate inputs
      if (!email || !password) {
        return { error: 'El correo y la contraseña son obligatorios' };
      }

      if (!this.isValidEmail(email)) {
        return { error: 'Formato de correo no válido' };
      }

      console.log('[AUTH] Attempting login for', email);

      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[AUTH] Login failed:', error);
        return { error: error || 'Login failed' };
      }

      const data = await response.json() as AuthResponse;

      // Store tokens
      if (data.token) {
        SecureStorage.saveAccessToken(data.token);
        
        // Extract user info from token
        const decoded = decodeJWT(data.token);
        if (decoded) {
          this.state.userId = decoded.userId;
          this.state.email = decoded.email;
          this.state.username = decoded.username;
        }
      }

      if (data.refreshToken) {
        SecureStorage.saveRefreshToken(data.refreshToken);
      }

      this.state.isAuthenticated = true;
      this.startTokenMonitor();

      console.log('[AUTH] Login successful for', email);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('[AUTH] Login error:', errorMessage);
      return { error: errorMessage };
    }
  }

  /**
   * Register new account
   */
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    try {
      // Validate inputs
      if (!email || !username || !password) {
        return { error: 'El correo, el usuario y la contraseña son obligatorios' };
      }

      if (!this.isValidEmail(email)) {
        return { error: 'Formato de correo no válido' };
      }

      if (password.length < 8) {
        return { error: 'La contraseña debe tener al menos 8 caracteres' };
      }

      console.log('[AUTH] Attempting registration for', email);

      const response = await fetch(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[AUTH] Registration failed:', error);
        return { error: error || 'Registration failed' };
      }

      const data = await response.json() as AuthResponse;

      // Auto-login after registration
      if (data.token) {
        SecureStorage.saveAccessToken(data.token);
        
        const decoded = decodeJWT(data.token);
        if (decoded) {
          this.state.userId = decoded.userId;
          this.state.email = decoded.email;
          this.state.username = decoded.username;
        }
      }

      if (data.refreshToken) {
        SecureStorage.saveRefreshToken(data.refreshToken);
      }

      this.state.isAuthenticated = true;
      this.startTokenMonitor();

      console.log('[AUTH] Registration successful for', email);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error('[AUTH] Registration error:', errorMessage);
      return { error: errorMessage };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken?: string): Promise<boolean> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshInProgress) {
      console.warn('[AUTH] Refresh already in progress');
      return false;
    }

    this.refreshInProgress = true;

    try {
      const token = refreshToken || SecureStorage.getRefreshToken();
      
      if (!token) {
        console.warn('[AUTH] No refresh token available');
        return false;
      }

      console.log('[AUTH] Refreshing access token');

      const response = await fetch(`${this.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: token }),
      });

      if (!response.ok) {
        console.error('[AUTH] Token refresh failed');
        // Clear tokens on refresh failure
        SecureStorage.clearAllTokens();
        this.state.isAuthenticated = false;
        return false;
      }

      const data = await response.json() as AuthResponse;

      if (data.token) {
        SecureStorage.saveAccessToken(data.token);
        this.state.lastRefresh = Date.now();
        console.log('[AUTH] Access token refreshed');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[AUTH] Refresh error:', error);
      return false;
    } finally {
      this.refreshInProgress = false;
    }
  }

  /**
   * Logout and clear tokens
   */
  logout(): void {
    try {
      console.log('[AUTH] Logging out');
      SecureStorage.clearAllTokens();
      this.stopTokenMonitor();
      
      this.state.isAuthenticated = false;
      this.state.userId = null;
      this.state.email = null;
      this.state.username = null;
      this.state.tokenExpiry = null;
      
      console.log('[AUTH] Logout successful');
    } catch (error) {
      console.error('[AUTH] Logout error:', error);
    }
  }

  /**
   * Get current authentication state
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Get access token for API calls
   */
  getToken(): string | null {
    return SecureStorage.getAccessToken();
  }

  /**
   * Get authorization header for API calls
   */
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated && SecureStorage.hasAccessToken();
  }

  /**
   * Start monitoring token expiry
   */
  private startTokenMonitor(): void {
    this.expiryMonitor.startMonitoring(
      () => this.onTokenAboutToExpire(),
      () => this.onTokenExpired()
    );
  }

  /**
   * Stop monitoring token expiry
   */
  private stopTokenMonitor(): void {
    this.expiryMonitor.stopMonitoring();
  }

  /**
   * Called when token is about to expire
   */
  private onTokenAboutToExpire(): void {
    console.warn('[AUTH] Token expiring soon, should refresh');
    const refreshToken = SecureStorage.getRefreshToken();
    if (refreshToken) {
      void this.refreshAccessToken(refreshToken);
    }
  }

  /**
   * Called when token expires
   */
  private onTokenExpired(): void {
    console.error('[AUTH] Token expired, logging out');
    this.logout();
  }

  /**
   * Basic email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get user info from current token
   */
  getUserInfo(): JWTPayload | null {
    const token = this.getToken();
    return token ? decodeJWT(token) : null;
  }

  /**
   * Destroy auth client
   */
  destroy(): void {
    this.stopTokenMonitor();
    this.expiryMonitor.destroy();
  }
}

// Global auth client instance
let authClientInstance: AuthClient | null = null;

/**
 * Initialize global auth client
 */
export function initAuthClient(apiUrl: string): AuthClient {
  if (authClientInstance) {
    return authClientInstance;
  }
  
  authClientInstance = new AuthClient(apiUrl);
  void authClientInstance.initialize();
  
  return authClientInstance;
}

/**
 * Get global auth client instance
 */
export function getAuthClient(): AuthClient | null {
  return authClientInstance;
}

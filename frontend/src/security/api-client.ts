/**
 * Secure API client
 * Handles authenticated API calls with token management
 */

import { getAuthClient, AuthClient } from './auth-client';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface ApiRequestOptions extends RequestInit {
  retryCount?: number;
  timeout?: number;
  validateStatus?: (status: number) => boolean;
}

/**
 * Secure API calls with automatic token injection and error handling
 */
export class ApiClient {
  private baseUrl: string;
  private authClient: AuthClient | null;
  private defaultTimeout = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.authClient = getAuthClient();
  }

  /**
   * Generic request method with token injection
   */
  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.resolveUrl(endpoint);
      const mergedOptions = this.mergeOptions(options);

      // Add auth header if authenticated
      if (this.authClient?.isAuthenticated()) {
        const authHeader = this.authClient.getAuthHeader();
        mergedOptions.headers = {
          ...mergedOptions.headers,
          ...authHeader,
        };
      }

      // Execute with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || this.defaultTimeout
      );

      const response = await fetch(url, {
        ...mergedOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && this.authClient?.isAuthenticated()) {
        console.warn('[API] Got 401, attempting token refresh');
        const refreshToken = localStorage.getItem('chiri_refresh_token');
        
        if (refreshToken) {
          const refreshed = await this.authClient.refreshAccessToken(refreshToken);
          
          if (refreshed && (options.retryCount ?? 0) < this.MAX_RETRIES) {
            // Retry request with new token
            return this.request<T>(endpoint, {
              ...options,
              retryCount: (options.retryCount ?? 0) + 1,
            });
          }
        }

        // Refresh failed, logout
        this.authClient.logout();
        return {
          success: false,
          error: 'Session expired. Please login again.',
          statusCode: 401,
        };
      }

      // Check if status is considered okay
      const isOK = options.validateStatus
        ? options.validateStatus(response.status)
        : response.ok;

      if (!isOK) {
        const error = await this.parseErrorResponse(response);
        return {
          success: false,
          error,
          statusCode: response.status,
        };
      }

      // Parse response
      const data = await this.parseResponse<T>(response);

      return {
        success: true,
        data,
        statusCode: response.status,
      };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error('[API] Request failed:', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Resolve full URL from endpoint
   */
  private resolveUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${path}`;
  }

  /**
   * Merge request options with defaults
   */
  private mergeOptions(options: ApiRequestOptions): RequestInit {
    return {
      credentials: 'include', // Send cookies with requests
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };
  }

  /**
   * Parse successful response
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    if (contentType?.includes('text')) {
      return (await response.text()) as any;
    }

    return null as any;
  }

  /**
   * Parse error response
   */
  private async parseErrorResponse(response: Response): Promise<string> {
    try {
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        const data = await response.json();
        return data.error || data.message || `HTTP ${response.status}`;
      }

      if (contentType?.includes('text')) {
        return await response.text();
      }

      return `HTTP ${response.status} ${response.statusText}`;
    } catch {
      return `HTTP ${response.status}`;
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch')) {
        return 'Network error. Please check your connection.';
      }
      if (error.message.includes('AbortError')) {
        return 'Request timeout. Please try again.';
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred';
  }

  /**
   * Set custom base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Global API client instance
let apiClientInstance: ApiClient | null = null;

/**
 * Initialize global API client
 */
export function initApiClient(baseUrl: string): ApiClient {
  if (apiClientInstance) {
    return apiClientInstance;
  }

  apiClientInstance = new ApiClient(baseUrl);
  return apiClientInstance;
}

/**
 * Get global API client instance
 */
export function getApiClient(): ApiClient | null {
  return apiClientInstance;
}

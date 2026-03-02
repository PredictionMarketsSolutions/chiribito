/**
 * Advanced input validation and sanitization utilities
 */

export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate email format with strict RFC 5322 compliance
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) return false;
  
  // Additional checks
  if (email.length > 254) return false; // Max email length
  
  const [localPart] = email.split('@');
  if (localPart.length > 64) return false; // Max local part length
  
  // Check for suspicious patterns
  if (/\.{2,}/.test(email)) return false; // Double dots
  if (/^\./.test(localPart)) return false; // Starts with dot
  if (/\.$/.test(localPart)) return false; // Ends with dot
  
  return true;
}

/**
 * Validate password strength based on NIST guidelines
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }
  
  // Length check - minimum 12 characters
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  // Maximum reasonable length
  if (password.length > 128) {
    errors.push('Password is too long');
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /^123456/,
    /^password/i,
    /^qwerty/i,
    /^abc123/i,
  ];
  
  if (weakPatterns.some(pattern => pattern.test(password))) {
    errors.push('Password contains common weak patterns');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Normalize and validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate URL to prevent open redirect attacks
 */
export function validateRedirectUrl(url: string, allowedDomains: string[]): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsedUrl = new URL(url, 'http://localhost');
    
    // Disallow protocol-relative URLs
    if (url.startsWith('//')) return false;
    
    // Disallow javascript: URLs
    if (url.toLowerCase().startsWith('javascript:')) return false;
    
    // Check if domain is in allowed list
    return allowedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname?.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Validate request boundaries to prevent DoS
 */
export interface ValidationBounds {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedValues?: string[];
}

export function validateWithBounds(value: string, bounds: ValidationBounds): boolean {
  if (!value || typeof value !== 'string') return false;
  
  if (bounds.minLength && value.length < bounds.minLength) return false;
  if (bounds.maxLength && value.length > bounds.maxLength) return false;
  if (bounds.pattern && !bounds.pattern.test(value)) return false;
  if (bounds.allowedValues && !bounds.allowedValues.includes(value)) return false;
  
  return true;
}

/**
 * Safe JSON parse with maximum depth limit to prevent attacks
 */
export function safeJsonParse<T = any>(
  json: string,
  maxDepth: number = 10
): T | null {
  try {
    let depth = 0;
    const reviver = (_key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        depth++;
        if (depth > maxDepth) {
          throw new Error('JSON depth exceeds maximum allowed');
        }
      }
      return value;
    };
    
    return JSON.parse(json, reviver);
  } catch {
    return null;
  }
}

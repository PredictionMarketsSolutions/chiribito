import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Token generation and validation utilities
 */

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a token using SHA-256
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a token against its hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}

/**
 * Generate a JWT token with custom claims
 */
export function generateJWT(
  payload: Record<string, any>,
  secret: string,
  expiresIn: string | number = '15m'
): string {
  return jwt.sign(payload, secret, { expiresIn } as any);
}

/**
 * Verify and decode a JWT token
 */
export function verifyJWT(
  token: string,
  secret: string,
  options?: jwt.VerifyOptions
): { valid: boolean; payload?: any; error?: string } {
  try {
    const decoded = jwt.verify(token, secret, options);
    return { valid: true, payload: decoded };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}

/**
 * Decode a JWT without verification (for inspection)
 */
export function decodeJWT(token: string): any | null {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

/**
 * Generate a token with version tracking for rotation
 */
export function generateVersionedToken(
  secret: string,
  version: number,
  expiresIn: string | number = '15m'
): string {
  const token = generateSecureToken();
  const versionedPayload = {
    token: hashToken(token),
    version,
    issuedAt: Date.now(),
  };
  
  const jwt_token = generateJWT(versionedPayload, secret, expiresIn);
  return `${token}.${jwt_token}`;
}

/**
 * Verify a versioned token
 */
export function verifyVersionedToken(
  versionedToken: string,
  secret: string,
  currentVersion: number
): { valid: boolean; version?: number; error?: string } {
  try {
    const [_token, jwtToken] = versionedToken.split('.');
    
    if (!jwtToken) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const decoded = jwt.verify(jwtToken, secret) as {
      token: string;
      version: number;
      issuedAt: number;
    };
    
    if (decoded.version !== currentVersion) {
      return {
        valid: false,
        version: decoded.version,
        error: 'Token version mismatch',
      };
    }
    
    return { valid: true, version: decoded.version };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}

/**
 * Hash a password using bcrypt-like approach but built-in
 * Note: For production, use bcryptjs package
 */
export function hashPassword(password: string, saltRounds: number = 10): string {
  // This is a simple PBKDF2 implementation; in production use bcryptjs
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha256')
    .toString('hex');
  
  return `${salt}:${hash}`;
}

/**
 * Verify a password against its hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  try {
    const [salt, storedHash] = hash.split(':');
    const testHash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, 'sha256')
      .toString('hex');
    
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(testHash),
      Buffer.from(storedHash)
    );
  } catch {
    return false;
  }
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encryptData(data: string, encryptionKey: string): string {
  const key = crypto.createHash('sha256').update(encryptionKey).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

/**
 * Decrypt data encrypted with encryptData
 */
export function decryptData(encryptedData: string, encryptionKey: string): string | null {
  try {
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    const [ivHex, encrypted, authTagHex] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch {
    return null;
  }
}

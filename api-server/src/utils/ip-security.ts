/**
 * IP address validation and security utilities
 */

/**
 * Validate IP address format (IPv4 or IPv6)
 */
export function isValidIPAddress(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  }
  
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::1|::)$/;
  return ipv6Pattern.test(ip);
}

/**
 * Extract client IP from request
 * Handles X-Forwarded-For, X-Real-IP headers and direct socket IP
 */
export function getClientIP(req: any): string {
  if (!req) return 'unknown';
  
  // Check X-Forwarded-For header (from reverse proxy)
  const xForwardedFor = req.headers?.['x-forwarded-for'];
  if (xForwardedFor) {
    // Header can contain multiple IPs, take the first one
    const ips = (xForwardedFor as string).split(',');
    return ips[0].trim();
  }
  
  // Check X-Real-IP header
  const xRealIP = req.headers?.['x-real-ip'];
  if (xRealIP) {
    return xRealIP as string;
  }
  
  // Direct socket connection
  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress;
  }
  
  // Fallback
  return req.ip || 'unknown';
}

/**
 * IP whitelist/blacklist manager
 */
export class IPAccessList {
  private whitelist: Set<string> = new Set();
  private blacklist: Set<string> = new Set();
  private cidrWhitelist: string[] = [];
  private cidrBlacklist: string[] = [];

  /**
   * Add IP to whitelist
   */
  addToWhitelist(ip: string): boolean {
    if (!isValidIPAddress(ip)) return false;
    this.whitelist.add(ip);
    return true;
  }

  /**
   * Add IP to blacklist
   */
  addToBlacklist(ip: string): boolean {
    if (!isValidIPAddress(ip)) return false;
    this.blacklist.add(ip);
    this.whitelist.delete(ip); // Remove from whitelist if present
    return true;
  }

  /**
   * Remove IP from whitelist
   */
  removeFromWhitelist(ip: string): void {
    this.whitelist.delete(ip);
  }

  /**
   * Remove IP from blacklist
   */
  removeFromBlacklist(ip: string): void {
    this.blacklist.delete(ip);
  }

  /**
   * Check if IP is allowed (whitelist takes precedence)
   */
  isAllowed(ip: string): boolean {
    if (this.whitelist.size > 0) {
      // If whitelist is defined, only those IPs are allowed
      return this.whitelist.has(ip);
    }
    
    // Otherwise, check blacklist (block if present)
    return !this.blacklist.has(ip);
  }

  /**
   * Get access list status
   */
  getStatus(): {
    whitelistSize: number;
    blacklistSize: number;
    hasWhitelist: boolean;
  } {
    return {
      whitelistSize: this.whitelist.size,
      blacklistSize: this.blacklist.size,
      hasWhitelist: this.whitelist.size > 0,
    };
  }
}

/**
 * Parse CIDR notation to check if IP falls within range
 * Example: "192.168.1.0/24"
 */
export function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    const [cidrIP, maskString] = cidr.split('/');
    if (!cidrIP || !maskString) return false;
    
    const mask = parseInt(maskString, 10);
    if (mask < 0 || mask > 32) return false;
    
    const ipParts = ip.split('.').map(Number);
    const cidrParts = cidrIP.split('.').map(Number);
    
    if (ipParts.length !== 4 || cidrParts.length !== 4) return false;
    if (ipParts.some(part => part < 0 || part > 255)) return false;
    if (cidrParts.some(part => part < 0 || part > 255)) return false;
    
    for (let i = 0; i < 4; i++) {
      const shift = 24 - i * 8;
      const maskBits = (0xff00000000000000 >> (shift + 8)) & 0xffffffff;
      
      if ((ipParts[i] & (maskBits >> (shift - 8))) !== (cidrParts[i] & (maskBits >> (shift - 8)))) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect VPN/Proxy use by checking for headers
 */
export function likelyUsesVPN(req: any): boolean {
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'x-client-ip',
    'user-agent', // Some VPNs modify user agent
  ];
  
  const vpnIndicators = [
    'vpn',
    'proxy',
    'tor',
    'anonymizer',
  ];
  
  // Check for suspicious headers
  for (const header of suspiciousHeaders) {
    const value = req.headers?.[header];
    if (value && typeof value === 'string') {
      for (const indicator of vpnIndicators) {
        if (value.toLowerCase().includes(indicator)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

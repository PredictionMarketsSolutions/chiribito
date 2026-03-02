# Security Enhancements Documentation

## Overview
This document outlines all the security enhancements and utilities implemented in the API server.

## Table of Contents
1. [HTTP Security Headers (Helmet)](#http-security-headers)
2. [Request Validation & Sanitization](#request-validation--sanitization)
3. [CSRF Protection](#csrf-protection)
4. [Cryptography Utilities](#cryptography-utilities)
5. [Rate Limiting](#rate-limiting)
6. [IP Security & Access Control](#ip-security--access-control)
7. [Security Monitoring](#security-monitoring)
8. [Request Analysis & Anomaly Detection](#request-analysis--anomaly-detection)
9. [Audit Logging](#audit-logging)
10. [Middleware Stack](#middleware-stack)

---

## HTTP Security Headers (Helmet)

### Features
- Content Security Policy (CSP) with strict directives
- Frame Guard (prevents clickjacking)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection enabled
- HSTS (HTTP Strict Transport Security)
- Referrer Policy: strict-origin-when-cross-origin

### Configuration Location
- `src/index.ts` - Lines with `helmet()` middleware

### Custom Headers Added
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Permissions-Policy: geolocation=(), microphone=(), camera=()

---

## Request Validation & Sanitization

### Available Utilities (`src/utils/validation.ts`)

#### Email Validation
```typescript
import { validateEmail } from './utils/validation';

const isValid = validateEmail('user@example.com');
// Checks: format, length, suspicious patterns
```

#### Password Validation (NIST Guidelines)
```typescript
import { validatePassword } from './utils/validation';

const result = validatePassword('MySecureP@ssw0rd!');
// Returns: { valid: boolean, errors: string[] }
// - Minimum 12 characters
// - No common weak patterns
```

#### String Sanitization
```typescript
import { sanitizeString } from './utils/validation';

const safe = sanitizeString(userInput);
// Prevents: XSS, HTML injection, etc.
```

#### UUID Validation
```typescript
import { validateUUID } from './utils/validation';

const isValid = validateUUID('550e8400-e29b-41d4-a716-446655440000');
```

#### URL Redirect Validation
```typescript
import { validateRedirectUrl } from './utils/validation';

const isValid = validateRedirectUrl(redirectUrl, ['example.com', 'app.example.com']);
// Prevents open redirect attacks
```

### Input Sanitization Middleware
Automatically sanitizes request body:
- Removes XSS patterns
- Strips potentially dangerous characters
- Removes JavaScript protocol handlers
- Clean output example format

---

## CSRF Protection

### Middleware Location
- `src/middleware/csrf.ts`

### Implementation
```typescript
import { csrfProtection, csrfTokenProvider } from './middleware/csrf';

// In your Express app:
app.use(csrfProtection);
app.use(csrfTokenProvider);
```

### How It Works
1. Generates CSRF token on first request
2. Stores in httpOnly cookie
3. Validates token in request header/body for state-changing requests
4. Strict SameSite cookie policy

### Client-Side Usage
```html
<form method="POST">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <!-- form fields -->
</form>
```

---

## Cryptography Utilities

### Available Functions (`src/utils/cryptography.ts`)

#### Token Generation
```typescript
import { generateSecureToken, hashToken } from './utils/cryptography';

const token = generateSecureToken(32); // 32 bytes
const hash = hashToken(token);
```

#### JWT Management
```typescript
import { generateJWT, verifyJWT, decodeJWT } from './utils/cryptography';

const token = generateJWT({ userId: 123, role: 'admin' }, SECRET, '15m');
const { valid, payload } = verifyJWT(token, SECRET);
const decoded = decodeJWT(token); // Without verification
```

#### Password Hashing (PBKDF2)
```typescript
import { hashPassword, verifyPassword } from './utils/cryptography';

const hash = hashPassword('myPassword');
const isValid = verifyPassword('myPassword', hash);
// Uses constant-time comparison to prevent timing attacks
```

#### Data Encryption (AES-256-GCM)
```typescript
import { encryptData, decryptData } from './utils/cryptography';

const encrypted = encryptData('sensitive data', encryptionKey);
const decrypted = decryptData(encrypted, encryptionKey);
```

---

## Rate Limiting

### Configuration
- Endpoint-specific limits configured in `src/index.ts`
- Redis-backed for persistence and distributed systems
- Fallback to in-memory in development

### Limits
| Endpoint | Window | Max Attempts | Purpose |
|----------|--------|-------------|---------|
| `/api/auth/register` | 15 min | 5 | Prevent account spam |
| `/api/auth/login` | 15 min | 10 | Prevent brute force |
| `/api/auth/forgot-password` | 15 min | 5 | Prevent password reset spam |
| `/api/auth/refresh` | 15 min | 30 | Prevent JWT token spam |
| `/api/auth/reset-password` | 15 min | 10 | Prevent password reset brute force |

---

## IP Security & Access Control

### Features (`src/utils/ip-security.ts`)

#### IP Validation
```typescript
import { isValidIPAddress, getClientIP } from './utils/ip-security';

const isValid = isValidIPAddress('192.168.1.1'); // IPv4 or IPv6
const clientIP = getClientIP(req); // Handles proxies, x-forwarded-for
```

#### IP Whitelist/Blacklist
```typescript
import { IPAccessList } from './utils/ip-security';

const accessList = new IPAccessList();
accessList.addToWhitelist('192.168.1.0/24');
accessList.addToBlacklist('192.168.1.100');

if (!accessList.isAllowed(clientIP)) {
  // Reject request
}
```

#### CIDR Range Checking
```typescript
import { isIPInCIDR } from './utils/ip-security';

const isInRange = isIPInCIDR('192.168.1.50', '192.168.1.0/24');
```

#### VPN/Proxy Detection
```typescript
import { likelyUsesVPN } from './utils/ip-security';

if (likelyUsesVPN(req)) {
  // User might be using VPN/proxy
}
```

---

## Security Monitoring

### Features (`src/utils/security-monitor.ts`)

#### Record Security Events
```typescript
import { securityMonitor, SecurityEventType, AUDIT_ACTIONS } from './utils/security-monitor';

securityMonitor.recordEvent(
  SecurityEventType.FAILED_LOGIN,
  'medium',
  clientIP,
  { email: 'user@example.com', reason: 'Invalid password' }
);
```

#### Available Event Types
- `FAILED_LOGIN` - Login failure
- `BRUTE_FORCE_ATTEMPT` - Multiple failed attempts
- `SUSPICIOUS_REQUEST` - Unusual request pattern
- `SQL_INJECTION_ATTEMPT` - SQL injection detected
- `XSS_ATTEMPT` - XSS pattern detected
- `RATE_LIMIT_EXCEEDED` - Rate limit triggered
- `INVALID_TOKEN` - JWT validation failed
- `PRIVILEGE_ESCALATION` - Unauthorized access attempt
- `DATA_EXFILTRATION` - Suspicious data access
- `UNAUTHORIZED_ACCESS` - Access denied

#### Query Events
```typescript
// Get recent events
const events = securityMonitor.getRecentEvents(50);

// Get by severity
const critical = securityMonitor.getEventsBySeverity('critical');

// Get unacknowledged alerts
const alerts = securityMonitor.getUnacknowledgedAlerts();

// Get summary
const summary = securityMonitor.getSummary();
```

---

## Request Analysis & Anomaly Detection

### Features (`src/utils/request-analyzer.ts`)

#### Record Request
```typescript
import { requestAnalyzer } from './utils/request-analyzer';

requestAnalyzer.recordRequest(
  clientIP,
  '/api/users',
  'GET',
  200,  // status code
  150   // response time in ms
);
```

#### Detect Anomalies
```typescript
const anomaly = requestAnalyzer.detectAnomalies(clientIP, '/api/users');

if (anomaly && anomaly.score > 50) {
  console.log('Suspicious activity:', anomaly.reasons);
  // Take action: block, require MFA, log, etc.
}
```

#### Detect Brute Force
```typescript
const bruteForceIPs = requestAnalyzer.detectBruteForce(
  '/api/auth/login',
  'POST',
  5,        // failure threshold
  300000    // 5 minute time window
);

for (const [ip, attempts] of bruteForceIPs.entries()) {
  console.log(`IP ${ip} has ${attempts} failed attempts`);
}
```

#### Get Statistics
```typescript
const stats = requestAnalyzer.getPatternStats();
// Returns: { totalPatterns, totalRequests, averageFrequency, topEndpoints }
```

---

## Audit Logging

### Features (`src/utils/audit.ts`)

#### Log Audit Actions
```typescript
import { logAudit, AUDIT_ACTIONS } from './utils/audit';

logAudit(
  AUDIT_ACTIONS.LOGIN_SUCCESS,
  clientIP,
  userAgent,
  'success',
  { userId: 123, email: 'user@example.com' }
);
```

#### Available Actions
- `LOGIN_ATTEMPT` / `LOGIN_SUCCESS` / `LOGIN_FAILED`
- `REGISTER_ATTEMPT` / `REGISTER_SUCCESS` / `REGISTER_FAILED`
- `PASSWORD_RESET_REQUEST` / `PASSWORD_RESET_SUCCESS` / `PASSWORD_RESET_FAILED`
- `TOKEN_REFRESH` / `TOKEN_REFRESH_FAILED`
- `ACCOUNT_DELETED`
- `INVALID_TOKEN`
- `RATE_LIMIT_EXCEEDED`
- `SUSPICIOUS_ACTIVITY`

---

## Middleware Stack

### Order of Execution (Top to Bottom)
1. **Trust Proxy** - For reverse proxies (Render, AWS ELB, etc.)
2. **Helmet** - Security headers
3. **Body Parser** - Size limits (10MB max)
4. **Morgan** - HTTP request logging
5. **Request Sanitization** - XSS/injection prevention
6. **Security Headers** - Additional custom headers
7. **Request ID** - Unique request tracking
8. **Attack Detection** - Pattern matching for SQL injection, XSS, etc.
9. **CORS** - Cross-origin request validation
10. **Express JSON** - JSON parsing
11. **Rate Limiting** - Per-endpoint rate limits (applied per route)
12. **Route Handlers**
13. **Error Handler** - Global error logging and sanitization

### Using Security Middleware
```typescript
import { securityMiddleware, auditLoggingMiddleware } from './middleware/security';

app.use(securityMiddleware({ enableMonitoring: true, anomalyThreshold: 50 }));
app.use(auditLoggingMiddleware);

// Now all requests are monitored and analyzed
```

---

## Environment Variables

```bash
# Existing
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes in ms (optional)
RATE_LIMIT_MAX=10         # Max requests per window (optional)

# CORS
ALLOWED_ORIGINS=https://frontend.example.com,https://api.example.com

# Monitoring
ENABLE_SECURITY_MONITORING=true
ENABLE_REQUEST_ANALYSIS=true
ANOMALY_THRESHOLD=50
```

---

## Best Practices

### 1. Always Validate Input
```typescript
import { validateEmail, validatePassword, sanitizeString } from './utils/validation';

// Validation
if (!validateEmail(email)) {
  return res.status(400).json({ error: 'Invalid email' });
}

// Password strength
const passCheck = validatePassword(password);
if (!passCheck.valid) {
  return res.status(400).json({ errors: passCheck.errors });
}

// Sanitization
const cleanName = sanitizeString(userInput);
```

### 2. Log Security Events
```typescript
import { securityMonitor, SecurityEventType } from './utils/security-monitor';

securityMonitor.recordEvent(
  SecurityEventType.FAILED_LOGIN,
  'medium',
  clientIP,
  { email, attempt: 2 }
);
```

### 3. Monitor for Anomalies
```typescript
const anomaly = requestAnalyzer.detectAnomalies(clientIP, endpoint, method);
if (anomaly && anomaly.score > 50) {
  // Block or require additional verification
  res.status(403).json({ error: 'Access denied' });
}
```

### 4. Use Encryption for Sensitive Data
```typescript
import { encryptData, decryptData } from './utils/cryptography';

const encrypted = encryptData(sensitiveData, encryptionKey);
// Store in database

const decrypted = decryptData(encrypted, encryptionKey);
```

### 5. Implement CSRF Protection
```typescript
app.use(csrfProtection);

// Client adds token to form
// Server validates before state-changing operations
```

### 6. Audit Important Actions
```typescript
import { logAudit, AUDIT_ACTIONS } from './utils/audit';

logAudit(
  AUDIT_ACTIONS.PASSWORD_RESET_SUCCESS,
  clientIP,
  userAgent,
  'success'
);
```

---

## Monitoring Dashboard

Access security information programmatically:

```typescript
// Security summary
const summary = securityMonitor.getSummary();
console.log(`Critical Events: ${summary.criticalCount}`);

// Request analysis
const stats = requestAnalyzer.getPatternStats();
console.log(`Top Endpoints:`, stats.topEndpoints);

// Unacknowledged alerts
const alerts = securityMonitor.getUnacknowledgedAlerts();
for (const alert of alerts) {
  console.log(`Alert: ${alert.event.type} - Action: ${alert.action}`);
  securityMonitor.acknowledgeAlert(alert.id);
}
```

---

## Future Enhancements

- [ ] Webhooks for critical security events
- [ ] Integration with SIEM systems
- [ ] Machine learning anomaly detection
- [ ] GeoIP blocking for specific regions
- [ ] Device fingerprinting for anomaly detection
- [ ] 2FA/MFA enforcement policies
- [ ] Session management and revocation
- [ ] Security event correlation
- [ ] Automated response actions

---

## Support & Debugging

Enable debug logging:

```bash
DEBUG=api:* npm start
```

Check security status:

```javascript
curl http://localhost:3000/health
```

Review recent security events:

```typescript
const events = securityMonitor.getRecentEvents(100);
events.forEach(event => console.log(event));
```

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/)
- [HELMET.js](https://helmetjs.github.io/)
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)


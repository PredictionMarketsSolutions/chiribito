# Security Policy & Practices

## Overview
This document outlines the security policies and best practices for the Chiri Backend project.

## 🚨 Critical Security Fixes Applied

### 1. ✅ Password Hashing (bcryptjs)
- **Issue**: Passwords were stored in plaintext
- **Fix**: Implemented bcryptjs hashing with:
  - Production: 12 rounds
  - Development: 10 rounds
- **Files**: `src/config/auth.ts`

### 2. ✅ Database SSL Validation
- **Issue**: SSL certificate validation was disabled (`rejectUnauthorized: false`)
- **Fix**: Enabled SSL cert validation in production
- **Files**: `api-server/src/config/database.ts`
- **Code**: `rejectUnauthorized: process.env.NODE_ENV === "production"`

### 3. ✅ Admin Routes Protection
- **Issue**: `/colyseus` (monitor) and `/playground` were publicly accessible
- **Fix**: Added Bearer token authentication middleware
- **Requirement**: Set `MONITOR_PASSWORD` environment variable
- **Usage**: `Authorization: Bearer {MONITOR_PASSWORD}`
- **Files**: `src/app.config.ts`

### 4. ✅ Removed Hardcoded Credentials
- **Issue**: Default passwords in code and test scripts
- **Fixes**:
  - Removed default password from frontend (`frontend/src/main.ts`)
  - Made test credentials required in scripts (`scripts/login-and-join.ts`)
  - Added validation for required environment variables

### 5. ✅ Removed Information Disclosure
- **Issue**: Route `/` exposed `NODE_APP_INSTANCE` ID
- **Fix**: Changed to generic "Server running" message

## Environment Variables (Required)

### Root `.env`
```env
PORT=2567
JWT_SECRET=use-strong-random-secret-min-32-chars
NODE_ENV=development|production
MONITOR_PASSWORD=secure-password-for-admin-routes
```

### `api-server/.env`
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=strong-password
DB_DATABASE=PokerBase
DB_SSL=false (true in production)
JWT_SECRET=must-match-root-env
NODE_ENV=development|production
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:2567
```

## Security Best Practices

### Development
- Use `.env.example` files (committed)
- Never commit `.env` files with real credentials
- Rotate secrets regularly
- Use development-grade passwords

### Production
- Use strong, randomly generated JWT secrets (min 32 characters)
- Use strong database passwords
- Set `NODE_ENV=production` to enable security features
- Use SSL/TLS certificates for database connections
- Set `MONITOR_PASSWORD` and restrict admin access
- Use environment variable management (AWS Secrets Manager, Azure Key Vault, etc.)
- Enable rate limiting on auth endpoints
- Use HTTPS for all frontend connections

## Known Vulnerabilities Patched

| Package | Severity | Status |
|---------|----------|--------|
| diff | Moderate | Fixed with audit |
| elliptic | Moderate | Fixed with audit |
| esbuild | Moderate | Fixed with audit |
| nanoid | Moderate | Fixed with audit |
| qs | Moderate | Fixed with audit |

Run `npm audit` in each directory to verify current status.

## Authentication Flow

1. **Register**: `POST /api/auth/register`
   - Username, email, password (hashed with bcrypt)
   - Returns JWT token

2. **Login**: `POST /api/auth/login`
   - Email, password
   - Verifies bcrypt hash
   - Returns JWT token

3. **Token Validation**
   - JWT verified with `JWT_SECRET`
   - Token included in `Authorization: Bearer {token}`

## Database Security

- Use strong passwords (min 12 characters with special chars)
- Enable SSL/TLS in production
- Restrict database access to app servers only
- Use separate database accounts with minimal privileges
- Regular backups with encryption
- Monitor access logs

## API Endpoints

### Protected Routes (Require MONITOR_PASSWORD)
- `GET /colyseus` - Monitor dashboard
- `GET /playground` - Playground UI

### Auth Routes (Public)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Protected Game Routes
Require JWT token in `Authorization` header

## Logging & Monitoring

- ✅ Never log passwords or password hashes
- ✅ Never log JWT tokens
- ✅ Log authentication failures with sanitized info
- ✅ Monitor for brute force attacks
- ✅ Alert on failed login attempts

## Code Review Checklist

Before deploying:
- [ ] All secrets in `.env`, not in code
- [ ] Environment variables validated at startup
- [ ] Sensitive data redacted in logs
- [ ] HTTPS enabled in production
- [ ] Database SSL/TLS enabled
- [ ] MONITOR_PASSWORD set
- [ ] JWT secrets are strong & unique
- [ ] Rate limiting enabled
- [ ] Dependencies audited (`npm audit`)

## Reporting Security Issues

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email security report with:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
3. Allow time for response before public disclosure

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [TypeORM Security](https://typeorm.io/#/security-guide)

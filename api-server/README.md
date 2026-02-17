# Poker Auth API Server

Express.js REST API for authentication, user management, and token validation.

## Architecture

```
api-server/
├── src/
│   ├── index.ts           # Express app, routes, middleware
│   ├── config/
│   │   ├── database.ts    # TypeORM + PostgreSQL connection
│   │   └── auth.ts        # JWT + bcryptjs configuration
│   ├── controllers/
│   │   ├── AuthController.ts  # Login, register, validation
│   │   └── UserController.ts  # User management
│   ├── middleware/
│   │   └── auth.ts        # JWT verification middleware
│   ├── models/
│   │   └── User.ts        # User entity/model
│   └── lib/
│       └── errorHandler.ts # Error handling utilities
├── .env                    # Environment variables (SECURITY CRITICAL)
├── tsconfig.json          # TypeScript config
└── package.json
```

## Environment Setup

### `.env` (SECURITY CRITICAL)

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-secure-password
DB_DATABASE=PokerBase
DB_SSL=false
JWT_SECRET=use-a-strong-random-secret-here-min-32-chars
NODE_ENV=development
BCRYPT_ROUNDS=10
```

**⚠️ Security Notes:**
- `DB_PASSWORD` should be 16+ random characters
- `JWT_SECRET` must be 32+ random characters (different from Colyseus secret in production)
- Set `DB_SSL=true` in production with proper certificates
- `BCRYPT_ROUNDS`: 10 for dev, 12 for prod
- Never commit `.env` with real secrets

Copy [.env.example](.env.example) to `.env`:
```bash
cp .env.example .env
```

## Setup

### First-time Installation

```bash
# Install dependencies
npm install

# Create database (if not exists)
psql -U postgres -c "CREATE DATABASE \"PokerBase\";"

# Run migrations
npm run migration:run -- -d src/config/database.ts
```

### Database Migrations

```bash
# Generate new migration
npm run migration:generate -- -n CreateUsersTable

# Run migrations
npm run migration:run -- -d src/config/database.ts

# Revert last migration
npm run migration:revert -- -d src/config/database.ts
```

## Running

### Development

```bash
npm run dev
```

Output:
```
Database connected successfully
Server is running on http://localhost:3000
```

### Production

```bash
npm run build
npm run start
```

## API Endpoints

### Authentication

**Register New User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

Response (201):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

Response (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Validate Token**
```http
POST /api/auth/validate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response (200):
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

Error (401):
```json
{ "error": "Invalid token" }
```

### User Management

**Get User Profile**
```http
GET /api/users/me
Authorization: Bearer <token>
```

**Update User**
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "new_username",
  "email": "newemail@example.com"
}
```

**Delete User**
```http
DELETE /api/users/me
Authorization: Bearer <token>
```

### Health Check

**Server Status**
```http
GET /health
```

Response (200):
```json
{
  "status": "ok",
  "timestamp": "2026-02-17T10:30:00Z"
}
```

## Authentication Flow

### Token Generation
1. User registers/logs in
2. Password hashed with bcryptjs (10-12 rounds)
3. JWT token generated with userId payload
4. Token valid for 7 days (configurable)

### Token Validation (Colyseus)
1. Client joins room with JWT token
2. Colyseus server calls this API: `POST /api/auth/validate`
3. API verifies JWT signature and checks user exists
4. Response includes user data
5. On invalid: 401 response triggers re-login

### Exponential Backoff
- Colyseus retries validation 3 times if API is slow
- Backoff: 500ms → 1s → 2s
- Timeout: 8 seconds per attempt

## Task List

```bash
# Build
npm run build

# Development with auto-reload
npm run dev

# Tests
npm run test

# Format code
npm run format

# Run scripts
npm run migration:generate -- -n MigrationName
npm run migration:run -- -d src/config/database.ts
npm run migration:revert -- -d src/config/database.ts
```

## Database Schema

### Users Table
```sql
CREATE TABLE "user" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  chips INT DEFAULT 1000,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security

✅ **Password Security**
- Bcryptjs hashing (10 rounds dev, 12 rounds prod)
- Passwords never logged or exposed
- Constant-time comparison

✅ **Token Security**
- JWT with HS256 signature
- Custom JWT_SECRET per environment
- Token expiration built-in

✅ **API Security**
- CORS enabled for Colyseus/frontend
- Rate limiting per route (future)
- Input validation on all endpoints

✅ **Database Security**
- SSL/TLS support (enabled in production)
- SQL injection protection via ORM
- Parameterized queries

## Troubleshooting

### `ECONNREFUSED` (Postgres)
1. Ensure Postgres is running
2. Verify `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`
3. Check database `PokerBase` exists

### `JWT_SECRET mismatch`
- Must match value in root `.env`
- Reset both to new value
- Existing tokens will be invalid

### `ER_DUP_ENTRY` on username/email
- Username or email already exists
- Suggest different email in register form

### High token validation latency
- Check network connection to Colyseus
- Verify `API_URL` in Colyseus `.env`
- API should respond in < 200ms

## Debugging

### Enable verbose logging

Set in `.env`:
```env
NODE_ENV=development
DEBUG=auth:*
```

### Test API with curl

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"TestPass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Validate token
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Performance

- Register: ~150ms (bcryptjs hashing)
- Login: ~150ms (bcryptjs comparison)
- Validate: ~50ms (JWT signature check + DB query)
- DB query: ~10ms (average)

## Related Documentation

- **[Main README](../README.md)** - Project overview
- **[SECURITY.md](../SECURITY.md)** - Security practices
- **[SOCKET_IMPROVEMENTS.md](../SOCKET_IMPROVEMENTS.md)** - Connection handling


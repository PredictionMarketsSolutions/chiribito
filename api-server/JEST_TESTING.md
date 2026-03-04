# Jest Testing Setup - API Server

## ¿Por qué NO funcionaba al principio?

### El Error Original 
```
Cannot find name 'describe'
Cannot find name 'jest'
Type 'Mock<UnknownFunction>' is not assignable to type 'Response'
```

### Las Causas

#### 1. **Imports Incorrectos (PRINCIPAL)**
```typescript
// ❌ INCORRECTO - Lo que intentamos primero
/// <reference types="jest" />
import { describe, it, expect } from 'expect'; // <- INCORRECTO
// describe, it, expect no existen en 'expect'
```

💡 **Solución Correcta:**
```typescript
// ✅ CORRECTO - Desde @jest/globals
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
```

#### 2. **Configuración de tsconfig.json Mezclada**
```json
// ❌ INCORRECTO - Intentar usar jest types globalmente
{
  "types": ["jest", "node"]  // No funciona para tests
}
```

**Problema:** El `tsconfig.json` principal NO debe incluir jest porque:
- La app no necesita jest (solo sourcecode)
- Causa conflictos de tipos globales
- El test runner (jest/ts-jest) usa su propia config

**Solución:** Separar configuraciones:
```
tsconfig.json → App code (excluye tests)
tsconfig.test.json → Tests solo (para ts-jest)
```

#### 3. **Mock Typing Incorrecto**
```typescript
// ❌ INCORRECTO - jest.fn() devuelve Mock, no Response
res = {
  status: jest.fn().mockReturnThis(),  // Mock<UnknownFunction> ≠ (code: number) => Response
  json: jest.fn().mockReturnThis()
};

// ✅ CORRECTO - Castear a 'any'
res = {
  status: jest.fn().mockReturnThis() as any,
  json: jest.fn().mockReturnThis() as any
} as any;
```

---

## ✅ La Solución Correcta (Paso a Paso)

### 1. **Instalar Dependencias**
```bash
npm install --save-dev @jest/globals jest ts-jest @types/jest
```

### 2. **jest.config.js**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'  // ← Usar config de tests
    }]
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node']
};
```

### 3. **tsconfig.json (App)**
```json
{
  "compilerOptions": {
    "types": ["node"]  // ← NO jest aquí
  },
  "exclude": ["node_modules", "src/__tests__"]  // ← Excluir tests
}
```

### 4. **tsconfig.test.json (Tests)**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "skipLibCheck": true,
    "noImplicitAny": false
  },
  "include": [
    "src/**/*.ts",
    "src/__tests__/**/*.test.ts"
  ]
}
```

### 5. **Test File**
```typescript
// ✅ CORRECTO
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

describe('MyTest', () => {
  let res: any;  // ← Tipado como 'any' para mocks
  
  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any
    } as any;
  });

  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

---

## 📊 Tests Actuales

### Ubicación
```
api-server/src/__tests__/middleware/auth.test.ts
```

### Suite: `authenticateJWT Middleware`
Total: **22 Tests Pasando ✅**

#### 1. **Happy Path - Valid Token** (2 tests)
- ✅ `should authenticate with valid JWT token`
- ✅ `should pass user object to next middleware`

#### 2. **Error Cases - Missing/Invalid Token** (6 tests)
- ✅ `should reject request without Authorization header`
- ✅ `should reject request with missing Bearer prefix`
- ✅ `should reject request with empty Bearer token`
- ✅ `should reject invalid JWT token`
- ✅ `should reject expired JWT token`
- ✅ `should reject token signed with different secret`

#### 3. **Database Errors** (2 tests)
- ✅ `should reject when user does not exist in database`
- ✅ `should reject when database query fails`

#### 4. **Token Version Validation** (3 tests)
- ✅ `should reject token with mismatched tokenVersion`
- ✅ `should accept when tokenVersion matches`
- ✅ `should handle null tokenVersion gracefully`

#### 5. **Edge Cases** (4 tests)
- ✅ `should handle malformed Authorization header gracefully`
- ✅ `should handle exception during JWT verification`
- ✅ `should not call next() on any error condition`
- ✅ `should handle case-insensitive Bearer prefix`

#### 6. **Environment Variable Handling** (1 test)
- ✅ `should throw error when JWT_SECRET is not set`

#### 7. **Performance and Efficiency** (2 tests)
- ✅ `should only query specific user fields (not full user object)`
- ✅ `should not expose sensitive fields to request object`

#### 8. **Logging and Monitoring** (2 tests)
- ✅ `should log authentication errors`
- ✅ `should log with appropriate error context`

---

## 🚀 Comandos Útiles

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests de auth middleware
```bash
npm test -- --testPathPattern=auth.test.ts
```

### Ejecutar tests sin coverage
```bash
npm test -- --no-coverage
```

### Ejecutar tests en modo watch (detección de cambios)
```bash
npm test -- --watch
```

### Ver coverage de tests
```bash
npm test -- --coverage
```

### Ejecutar un test específico
```bash
npm test -- -t "should authenticate with valid JWT token"
```

---

## 🔍 Verificar Compilación

### App Principal (sin tests)
```bash
npx tsc --noEmit
# Output: 0 errors
```

### Tests con ts-jest
```bash
npm test
# Output: Test Suites: 1 passed, Tests: 22 passed
```

---

## 📝 Estructura Recomendada para Nuevos Tests

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Jest } from '@jest/globals';

// Mock external dependencies
jest.mock('../../config/database');
jest.mock('../../config/logger');

describe('MyFeature', () => {
  let mockRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockRepository = {
      findOne: jest.fn()
    };
  });

  describe('Happy Path', () => {
    it('should do something', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue({ id: 1 });

      // Act
      const result = await someFunction();

      // Assert
      expect(result).toBeDefined();
      expect(mockRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('Error Cases', () => {
    it('should handle errors gracefully', async () => {
      // Arrange
      mockRepository.findOne.mockRejectedValue(new Error('DB error'));

      // Act & Assert
      await expect(someFunction()).rejects.toThrow('DB error');
    });
  });
});
```

---

## ✅ Resumen: Qué Aprendimos

| Problema | Causa | Solución |
|----------|-------|----------|
| `Cannot find name 'describe'` | Imports incorrectos | Usar `from '@jest/globals'` |
| `Cannot find type definition file for 'jest'` | Types globales en tsconfig.json | Remover "jest" de types |
| `Type 'Mock' not assignable to 'Response'` | Mocks sin cast | Usar `as any` en mocks |
| Conflictos de tipos | Mezclar app + test configs | Separar tsconfig.json y tsconfig.test.json |

**Clave:** Con `@jest/globals`, los tipos se obtienen de las importaciones, no de declaraciones globales. ✨


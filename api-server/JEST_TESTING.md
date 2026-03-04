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

## 🎭 Manual Mocks (Referencia para Próximos Tests)

### Estructura de Directorios para Mocks

```
api-server/
├── src/
│   ├── config/
│   │   ├── __mocks__/
│   │   │   ├── database.ts      # Mock de AppDataSource
│   │   │   └── logger.ts        # Mock de logger
│   │   ├── database.ts
│   │   └── logger.ts
│   ├── services/
│   │   ├── __mocks__/
│   │   │   └── EmailService.ts  # Mock de servicio de email
│   │   └── EmailService.ts
│   └── __tests__/
│       ├── middleware/
│       │   └── auth.test.ts
│       └── controllers/
│           └── UserController.test.ts
├── jest.config.js
└── tsconfig.test.json
```

### Tipos de Mocks en Jest

#### 1. **Inline Mocks (Lo que usamos actualmente en auth.test.ts)**
```typescript
// ✅ ACTUAL - Mocking dentro del test
jest.mock('../../config/database');
jest.mock('../../config/logger');

describe('authenticateJWT', () => {
  beforeEach(() => {
    mockUserRepository = {
      findOne: jest.fn()
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);
  });
});
```

**Ventajas:** Simple para casos pequeños  
**Desventajas:** Código duplicado si muchos tests lo necesitan

#### 2. **Manual Mocks en __mocks__/ (Para próximos tests)**
Créa cuando el mock es complejo o needed en múltiples tests.

**Ejemplo para database:**
```typescript
// src/config/__mocks__/database.ts
import { jest } from '@jest/globals';

export const AppDataSource = {
  getRepository: jest.fn().mockReturnValue({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn()
  }),
  initialize: jest.fn().mockResolvedValue(undefined),
  isInitialized: true,
  destroy: jest.fn().mockResolvedValue(undefined)
};
```

**En el test:**
```typescript
// src/__tests__/middleware/auth.test.ts
jest.mock('../../config/database');  // Automáticamente usa __mocks__/database.ts
import { AppDataSource } from '../../config/database';

describe('authenticateJWT', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should work', () => {
    AppDataSource.getRepository.mockReturnValue({
      findOne: jest.fn().mockResolvedValue({ id: 1 })
    });
  });
});
```

#### 3. **jest.createMockFromModule() (Para mocks avanzados)**
Extiende automocks con comportamiento personalizado:

```typescript
// src/services/__mocks__/EmailService.ts
import { jest } from '@jest/globals';

const EmailService = jest.createMockFromModule<typeof import('../EmailService')>('../EmailService');

let emailsSent: any[] = [];

export const mockEmailService = {
  sendEmail: jest.fn(async (to: string, subject: string) => {
    emailsSent.push({ to, subject });
    return { success: true, messageId: 'mock-123' };
  }),
  getEmailsSent: () => emailsSent,
  resetEmails: () => { emailsSent = []; }
};

// Override el módulo
Object.assign(EmailService, mockEmailService);

module.exports = EmailService;
```

**En test:**
```typescript
jest.mock('../../services/EmailService');
import { mockEmailService } from '../../services/__mocks__/EmailService';

describe('UserController', () => {
  beforeEach(() => {
    mockEmailService.resetEmails();
  });

  it('should send welcome email', async () => {
    // Act
    await userController.register(req, res);

    // Assert
    expect(mockEmailService.getEmailsSent()).toEqual([
      expect.objectContaining({ to: 'user@example.com' })
    ]);
  });
});
```

#### 4. **jest.requireActual() (Híbrido: Mock + Real)**
Para mockear SOLO ciertas funciones, no todo el módulo:

```typescript
// src/config/__mocks__/logger.ts
import { jest } from '@jest/globals';

// Obtener la implementación real
const actualLogger = jest.requireActual<typeof import('../logger')>('../logger');

// Extender con mocks
export default {
  ...actualLogger,  // Mantener comportamiento real
  error: jest.fn(), // Override solo lo que necesitas
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};
```

### Reglas Importantes para Mocks

| Regla | Aplica? | Razón |
|-------|---------|-------|
| `jest.mock()` debe ser en el mismo scope que import | ✅ SÍ | Jest hoista los mocks, pero deben estar en el mismo archivo |
| Puedo mockear módulos de Node (fs, path) | ✅ SÍ, con `jest.mock('fs')` | Node modules NO se mockean automáticamente |
| Puedo mockear módulos locales sin `jest.mock()` | ❌ NO | Siempre requiere `jest.mock('./moduleName')` explícito |
| __mocks__/ debe ser adjacent a node_modules | ✅ SÍ para scoped packages<br>❌ NO para locales | Para `@scope/package`, crear `__mocks__/@scope/package.js` |
| jest.mock() se ejecuta antes que imports | ✅ SÍ (CommonJS) | Es hoisted automáticamente |
| jest.mock() se ejecuta antes que imports | ❌ NO (ES Modules) | ESM loader ejecuta imports primero |

### Checklist para Próximos Tests

- [ ] ¿Es un mock simple? → Usar inline como en auth.test.ts
- [ ] ¿Se repite en varios tests? → Crear en `__mocks__/`
- [ ] ¿Necesito mock + comportamiento real? → Usar `jest.requireActual()`
- [ ] ¿Necesito setupo_complejo? → Crear función helper en `__mocks__/`
- [ ] ¿Es módulo de Node? → Agregar `jest.mock('moduleName')` explícitamente
- [ ] ¿Es módulo scoped? → Crear `__mocks__/@scope/package/`

---

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


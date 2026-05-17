module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
   // Increase timeout for tests
  testTimeout: 10000,
  
  // Fuerza la salida si el event loop sigue activo (Colyseus, Winston, timers).
  // El aviso "Force exiting Jest" es esperado; para localizar handles: npm run test:jest:debug
  forceExit: true,
  detectOpenHandles: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/__tests__/**',
    '!src/**/types/**',
    '!src/**/schema/**',
    '!src/app.config.ts',
    '!src/config/**',
    '!src/security/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/rooms/ChiribitoRoom.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/rooms/game/GameEngine.ts': {
      branches: 75,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/rooms/managers/': {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'json-summary', // Para CI: coverage/coverage-summary.json (comentario en PR)
  ],
  
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }],
  },

  // Use CJS mock for rou3 (ESM) so @colyseus/core/better-call loads under Jest
  moduleNameMapper: {
    '^rou3$': '<rootDir>/src/__tests__/__mocks__/rou3.cjs',
  },

  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};

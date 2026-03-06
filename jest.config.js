module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
   // Increase timeout for tests
  testTimeout: 10000,
  
  // Force Jest to exit after tests complete
  forceExit: false,
  
  // Close all handles and free resources
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
    '!src/rooms/MyRoom.ts',
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
    './src/rooms/game/GameEngine.ts': {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
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

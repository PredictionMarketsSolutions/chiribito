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
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 1,
      lines: 1,
      statements: 1,
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

  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};

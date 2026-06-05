module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/client/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  testMatch: [
    '<rootDir>/client/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/client/src/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/server/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/server/**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    'server/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/test/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  roots: ['<rootDir>/client/src', '<rootDir>/server'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ]
};